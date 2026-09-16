//! Manages the connection to the single long-running AutomationAgent.exe
//! background process. This module never contains automation logic itself -
//! it only makes sure exactly one agent process is running and forwards
//! JSON requests/events to and from it over a loopback TCP socket.

use serde_json::{json, Value};
use std::collections::HashMap;
use std::process::Command;
use std::sync::{Arc, Mutex as StdMutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::tcp::OwnedWriteHalf;
use tokio::net::TcpStream;
use tokio::sync::{oneshot, Mutex as AsyncMutex};

const AGENT_PORT: u16 = 51823;
const CONNECT_ATTEMPT_TIMEOUT: Duration = Duration::from_millis(300);
const SPAWN_RETRY_ATTEMPTS: u32 = 15;
const SPAWN_RETRY_DELAY: Duration = Duration::from_millis(200);
const SPAWN_COOLDOWN: Duration = Duration::from_secs(5);

type PendingMap = Arc<StdMutex<HashMap<String, oneshot::Sender<Result<Value, String>>>>>;

/// Tauri-managed state: at most one live connection to the agent, plus the
/// table of requests currently awaiting a response.
#[derive(Default)]
pub struct AgentState {
    writer: AsyncMutex<Option<OwnedWriteHalf>>,
    pending: PendingMap,
    last_spawn_attempt: StdMutex<Option<Instant>>,
}

/// Sends one request to the agent and waits for its response. Connects (and,
/// if needed, starts the agent process) on demand - callers never spawn a
/// process themselves.
pub async fn send_request(app: &AppHandle, command: &str, payload: Value) -> Result<Value, String> {
    let state = app.state::<AgentState>();
    ensure_connected(app, &state).await?;
    send_over_connection(&state, command, payload).await
}

/// Writes one request directly to whatever connection is currently in
/// state.writer and waits for its response. Assumes the connection is
/// already established - callers that might need to connect first should go
/// through send_request or ensure_connected instead.
async fn send_over_connection(state: &AgentState, command: &str, payload: Value) -> Result<Value, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let (tx, rx) = oneshot::channel();
    state.pending.lock().unwrap().insert(id.clone(), tx);

    let line = serde_json::to_string(&json!({ "id": id, "command": command, "payload": payload }))
        .map_err(|e| e.to_string())?
        + "\n";

    {
        let mut guard = state.writer.lock().await;
        let Some(writer) = guard.as_mut() else {
            state.pending.lock().unwrap().remove(&id);
            return Err("Agent unavailable.".to_string());
        };
        if let Err(e) = writer.write_all(line.as_bytes()).await {
            *guard = None;
            state.pending.lock().unwrap().remove(&id);
            return Err(format!("Lost connection to the agent while sending a request: {e}"));
        }
    }

    match rx.await {
        Ok(result) => result,
        Err(_) => Err("The agent connection closed before responding.".to_string()),
    }
}

/// Ensures state.writer holds a live, verified connection - connecting (and
/// spawning the agent at most once per call) if it doesn't. Holding the
/// writer lock for the whole check-then-connect sequence means concurrent
/// callers never race into spawning two agent processes.
async fn ensure_connected(app: &AppHandle, state: &AgentState) -> Result<(), String> {
    let mut guard = state.writer.lock().await;
    if guard.is_some() {
        return Ok(());
    }

    let stream = match try_connect_once().await {
        Some(stream) => stream,
        None => {
            spawn_agent_if_allowed(app, state)?;
            connect_with_retries().await.ok_or_else(|| {
                "Agent unavailable - could not start or reach the automation agent.".to_string()
            })?
        }
    };

    let (read_half, write_half) = stream.into_split();
    *guard = Some(write_half);
    drop(guard);

    spawn_reader_loop(app.clone(), read_half, state.pending.clone());

    // Verify whatever we connected to actually speaks our protocol before
    // trusting it - if the port is held by an unrelated process, this fails
    // fast and we report "unavailable" instead of spawning a competitor.
    if let Err(e) = send_over_connection(state, "ping", json!({})).await {
        let mut guard = state.writer.lock().await;
        *guard = None;
        return Err(format!("Agent unavailable - the local port did not respond as expected. {e}"));
    }

    Ok(())
}

fn spawn_agent_if_allowed(app: &AppHandle, state: &AgentState) -> Result<(), String> {
    let mut last_attempt = state.last_spawn_attempt.lock().unwrap();
    if let Some(previous) = *last_attempt {
        if previous.elapsed() < SPAWN_COOLDOWN {
            return Err("Agent unavailable - a previous attempt to start it failed recently.".to_string());
        }
    }
    *last_attempt = Some(Instant::now());
    drop(last_attempt);

    let exe_path = agent_exe_path(app)?;

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        Command::new(&exe_path)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("Could not start the automation agent ({}): {e}", exe_path.display()))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new(&exe_path)
            .spawn()
            .map_err(|e| format!("Could not start the automation agent ({}): {e}", exe_path.display()))?;
    }

    Ok(())
}

fn agent_exe_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    if cfg!(debug_assertions) {
        // Dev build: reach into the sibling agent project's own build output.
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let path = std::path::Path::new(manifest_dir)
            .join("..")
            .join("agent")
            .join("AutomationAgent")
            .join("bin")
            .join("Debug")
            .join("net9.0")
            .join("AutomationAgent.exe");
        return Ok(path);
    }

    // Release build: the agent is published into an "agent" folder next to
    // the main executable (see package.json's build:agent script and
    // tauri.conf.json's bundle.resources).
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Could not resolve the app's resource directory: {e}"))?;
    Ok(resource_dir.join("agent").join("AutomationAgent.exe"))
}

async fn try_connect_once() -> Option<TcpStream> {
    let addr = ("127.0.0.1", AGENT_PORT);
    tokio::time::timeout(CONNECT_ATTEMPT_TIMEOUT, TcpStream::connect(addr))
        .await
        .ok()?
        .ok()
}

async fn connect_with_retries() -> Option<TcpStream> {
    for _ in 0..SPAWN_RETRY_ATTEMPTS {
        if let Some(stream) = try_connect_once().await {
            return Some(stream);
        }
        tokio::time::sleep(SPAWN_RETRY_DELAY).await;
    }
    None
}

/// The single reader loop for the connection: demultiplexes response lines
/// back to their caller by id, and forwards event lines to the frontend as
/// Tauri events. Only this loop ever reads from the socket.
fn spawn_reader_loop(
    app: AppHandle,
    read_half: tokio::net::tcp::OwnedReadHalf,
    pending: PendingMap,
) {
    tauri::async_runtime::spawn(async move {
        let mut lines = BufReader::new(read_half).lines();
        loop {
            match lines.next_line().await {
                Ok(Some(line)) => handle_line(&app, &pending, &line),
                Ok(None) | Err(_) => break, // connection closed
            }
        }

        // The connection is gone - clear it so the next request reconnects,
        // and fail out any requests that were still waiting on it.
        let state = app.state::<AgentState>();
        *state.writer.lock().await = None;
        let mut pending_guard = pending.lock().unwrap();
        for (_, sender) in pending_guard.drain() {
            let _ = sender.send(Err("The agent connection closed.".to_string()));
        }
    });
}

fn handle_line(app: &AppHandle, pending: &PendingMap, line: &str) {
    let Ok(message) = serde_json::from_str::<Value>(line) else {
        return;
    };

    match message.get("type").and_then(Value::as_str) {
        Some("response") => {
            let id = message.get("id").and_then(Value::as_str).unwrap_or_default();
            let Some(sender) = pending.lock().unwrap().remove(id) else {
                return;
            };
            let ok = message.get("ok").and_then(Value::as_bool).unwrap_or(false);
            let result = if ok {
                Ok(message.get("data").cloned().unwrap_or(Value::Null))
            } else {
                Err(message
                    .get("error")
                    .and_then(Value::as_str)
                    .unwrap_or("The agent reported an error.")
                    .to_string())
            };
            let _ = sender.send(result);
        }
        Some("event") => {
            let _ = app.emit("agent-event", message);
        }
        _ => {}
    }
}
