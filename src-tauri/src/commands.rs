//! Thin Tauri commands: every one of these just builds a payload and calls
//! agent::send_request. No automation or business logic lives here - that is
//! entirely the C# agent's job.

use crate::agent;
use serde_json::{json, Value};
use tauri::AppHandle;

type CommandResult = Result<Value, String>;

#[tauri::command]
pub async fn list_profiles(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "list-profiles", json!({})).await
}

#[tauri::command]
pub async fn get_profile(app: AppHandle, id: String) -> CommandResult {
    agent::send_request(&app, "get-profile", json!({ "id": id })).await
}

#[tauri::command]
pub async fn save_profile(app: AppHandle, profile: Value) -> CommandResult {
    agent::send_request(&app, "save-profile", json!({ "profile": profile })).await
}

#[tauri::command]
pub async fn delete_profile(app: AppHandle, id: String) -> CommandResult {
    agent::send_request(&app, "delete-profile", json!({ "id": id })).await
}

#[tauri::command]
pub async fn duplicate_profile(app: AppHandle, id: String) -> CommandResult {
    agent::send_request(&app, "duplicate-profile", json!({ "id": id })).await
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "get-settings", json!({})).await
}

#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: Value) -> CommandResult {
    agent::send_request(&app, "save-settings", json!({ "settings": settings })).await
}

#[tauri::command]
pub async fn list_chrome_profiles(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "list-chrome-profiles", json!({})).await
}

#[tauri::command]
pub async fn list_executions(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "list-executions", json!({})).await
}

#[tauri::command]
pub async fn get_execution(app: AppHandle, id: String) -> CommandResult {
    agent::send_request(&app, "get-execution", json!({ "id": id })).await
}

#[tauri::command]
pub async fn run_profile(app: AppHandle, profile_id: String) -> CommandResult {
    agent::send_request(&app, "run", json!({ "profileId": profile_id })).await
}

#[tauri::command]
pub async fn agent_status(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "agent-status", json!({})).await
}

#[tauri::command]
pub async fn register_startup(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "register-startup", json!({})).await
}

#[tauri::command]
pub async fn unregister_startup(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "unregister-startup", json!({})).await
}

#[tauri::command]
pub async fn open_log_folder(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "open-log-folder", json!({})).await
}

/// Tells the running agent to shut down, then lets the next request start a
/// fresh one - it does not spawn a new process itself.
#[tauri::command]
pub async fn exit_agent(app: AppHandle) -> CommandResult {
    agent::send_request(&app, "shutdown", json!({})).await
}

#[tauri::command]
pub async fn restart_agent(app: AppHandle) -> CommandResult {
    let result = agent::send_request(&app, "shutdown", json!({})).await;
    tokio::time::sleep(std::time::Duration::from_millis(400)).await;
    agent::send_request(&app, "ping", json!({})).await?;
    result
}
