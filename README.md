# Automation Launcher

A Windows desktop app for defining **automation profiles** — ordered
sequences of apps, URLs, Chrome/Edge windows, shortcuts, and pauses — that
run on demand or automatically at Windows login.

## Features

- Create, edit, duplicate, and delete automation profiles
- Five task types: **Application** (`.exe` or `.lnk` shortcut), **URL**,
  **Chrome** (with automatic profile discovery and manual fallback),
  **Microsoft Edge**, and **Wait**
- Reorder, enable/disable, and configure per-task delays
- **Run Now** with live, task-by-task progress
- Automatic execution of a chosen startup profile at Windows login, with a
  configurable delay
- Execution history with per-task results and human-readable error messages
- Settings for general behavior, startup automation, appearance
  (dark/light/system), and agent management
- Desktop notifications on run completion

## Installing (for end users)

You don't need Node, Rust, or .NET installed to just *use* the app - those
are only required to build it. To install and run it:

1. **Get the installer.** Either download it from this repository's
   [Releases](../../releases) page if one has been published, or build it
   yourself (see "Building the Windows application" below) — the installer
   ends up at `src-tauri/target/release/bundle/nsis/Automation Launcher_<version>_x64-setup.exe`
   (or the `.msi` next to it).
2. **Run the installer** and follow the prompts. Since it isn't code-signed,
   Windows SmartScreen will likely show an "unrecognized app" warning the
   first time — click **More info → Run anyway** if you trust where it came
   from.
3. **Launch "Automation Launcher"** from the Start Menu.
4. On first launch there's nothing configured yet - go to **Profiles →
   Create Profile**, add a few tasks (an app, a URL, a Chrome/Edge window,
   or a wait), and hit **Run Now** to try it.
5. To have a profile run automatically every time you log into Windows: open
   **Settings → Startup**, choose that profile, set a delay if you want one,
   and turn on **Enable startup automation**. This is the one action that
   actually modifies your Windows configuration (it registers a per-user
   Task Scheduler entry) - it only happens when you flip this switch
   yourself.

**Your data** lives in `%APPDATA%\AutomationLauncher\` (profiles, settings,
execution history, logs) - it's created automatically and isn't touched by
reinstalling the app.

**To uninstall:** if you enabled startup automation, turn it off in Settings
first (this removes the Task Scheduler entry), then uninstall normally via
Windows Settings → Apps. Uninstalling doesn't delete
`%APPDATA%\AutomationLauncher\` - remove that folder yourself if you want a
completely clean removal.

## Architecture

```
React UI (Vite/TS/Tailwind/shadcn)
        |  Tauri invoke()
Tauri Rust shell (thin: keeps one agent connection alive, forwards requests)
        |  loopback TCP, JSON lines, 127.0.0.1:51823
AutomationAgent.exe - one long-running per-user process
        |  Process.Start / schtasks.exe
Windows APIs, Chrome/Edge/apps, Task Scheduler
```

All automation logic — launching apps, validating paths/URLs, running tasks
in order, writing logs and history — lives in the **C# agent**. The
Rust/Tauri layer never touches Windows APIs directly; it only makes sure
exactly one agent process is running and relays JSON requests/events to it.
React never talks to Windows or the agent's process directly - it only calls
Tauri commands.

**Why a persistent agent instead of spawning one per action:** the agent is
started once (by Tauri on first use, or by Task Scheduler at login) and kept
alive for as long as Windows is logged in. A named Mutex guarantees only one
instance ever runs. Tauri reuses a single TCP connection and a single reader
task for the whole app session; every request carries a correlation id so
concurrent commands (and the task-by-task progress events streamed during a
run) never get mixed up. Closing the app window only closes that connection —
the agent keeps running until Windows logs out, or until "Exit agent" /
"Restart agent" in Settings.

## Technology stack

| Layer | Technology |
|---|---|
| UI | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide icons |
| State/validation | Zustand, Zod |
| Desktop shell | Tauri v2 (Rust) |
| Automation agent | .NET 9 (C#) |
| Storage | Local JSON files (no database) |
| Tests | Vitest (frontend), xUnit (agent) |

## Project structure

```
src/                    React frontend
  pages/                 Dashboard, Profiles, Profile editor, Execution history/detail, Settings
  features/              profiles/, tasks/, executions/ - feature-specific components
  stores/                zustand: profiles, executions, settings, agent status, navigation
  types/, schemas/        TypeScript types and Zod validation (manually kept in sync with the C# models)
  lib/ipc.ts             every Tauri command call, typed

src-tauri/               Tauri v2 shell (Rust)
  src/agent.rs            connects to / spawns the agent, single reader loop, correlation ids
  src/commands.rs         thin #[tauri::command] wrappers, one per agent IPC command

agent/AutomationAgent/   The C# background agent (.NET 9)
  Models/                 AutomationProfile, AutomationTask, AppSettings, ExecutionRecord
  Storage/                 atomic (write-temp-then-rename) JSON read/write, safe defaults on corrupt files
  Services/                ProfileManager, ConfigurationStore, ExecutionHistoryStore, IpcServer, StartupManager, SingleInstance
  Executors/                ITaskExecutor + one class per task type, routed by TaskRunner (one run at a time)
  Windows/                  BrowserLocator, ChromeProfileDiscovery (reads Chrome's Local State), SchTasksStartupRegistrar
agent/AutomationAgent.Tests/   xUnit tests
```

Storage lives under `%APPDATA%\AutomationLauncher\`: `profiles.json`,
`settings.json`, `executions\*.json` (one file per run), `logs\agent-*.log`.
None of this is part of the repository.

## Development requirements

- Node.js 20+
- Rust (stable, 1.85+ for edition2024 support)
- .NET 9 SDK

## Getting started

```bash
npm install
npm run tauri dev
```

This starts Vite, then Tauri, which on first use automatically starts
`AutomationAgent.exe` from `agent/AutomationAgent/bin/Debug/net9.0/` and
connects to it. You do not need to build or run the agent separately.

Other scripts:

- `npm run dev` — Vite only (no Tauri window; Tauri-specific features like
  the agent connection, native file picker, and notifications won't work
  here).
- `npm run test` — Vitest (frontend logic/validation tests).
- `npm run lint` — oxlint.
- `dotnet test agent` — the C# unit tests.

## Building the Windows application

```bash
npm run build:agent   # publishes the agent as a self-contained single-file exe into src-tauri/resources/agent
npm run tauri build   # builds the frontend, the Rust shell, and bundles both into an installer
```

`build:agent` must be run at least once before `tauri build` produces a
working installer, since the release build expects the agent already
published at `src-tauri/resources/agent/AutomationAgent.exe` (see
`tauri.conf.json`'s `bundle.resources` and `agent_exe_path` in `agent.rs`).
The result is an MSI and an NSIS installer under
`src-tauri/target/release/bundle/`.

## How the C# agent works

`AutomationAgent.exe` is a small, self-hosted background process — not a
Windows Service. On startup it acquires a named Mutex (single-instance
protection), starts a loopback TCP listener on `127.0.0.1:51823`, and waits
for JSON commands. Each command is one of: profile/settings CRUD, `run`
(executes a profile's tasks sequentially with `continueOnError = true`,
streaming per-task status events back to the caller), `list-executions`,
`register-startup` / `unregister-startup`, or `shutdown`. Executors never
throw raw exceptions to the caller - every failure is converted into a short,
human-readable message.

## How startup automation works

Settings → Startup has "Enable startup automation", a startup profile, and a
startup delay (default 10s). Turning it on calls the agent's
`register-startup` command, which registers a per-user Task Scheduler entry
(`schtasks /Create /TN AutomationLauncherAgent /SC ONLOGON ...`) that runs
`AutomationAgent.exe --startup` at login. In that mode the agent waits the
configured delay, loads the startup profile, and runs it — then keeps
serving normally, so the UI can still connect to it if you open the app
later in that session. Turning the setting off calls `unregister-startup`,
which removes the task.

**`schtasks.exe` is only ever invoked when you actually toggle this setting
in the running app.** It is never run automatically as part of development,
testing, or building this project. `SchTasksStartupRegistrar`'s
argument-building is covered by unit tests that never execute `schtasks.exe`
itself.

## Troubleshooting

- **"Port 1420 is already in use"** when running `npm run tauri dev` — a
  previous dev server is still running. Stop it (check Task Manager for
  `app.exe` / `node.exe`) and try again.
- **"Agent unavailable" in the UI** — the agent couldn't be started or
  reached on `127.0.0.1:51823`. Check Settings → Agent → "Restart agent", or
  look at `%APPDATA%\AutomationLauncher\logs\` for the agent's own log.
- **A profile's Application task fails with "could not be found"** — the
  configured `.exe`/`.lnk` path no longer exists, or points to something a
  file-browse dialog can't see directly (e.g. a Store-installed app);
  pointing the task at a desktop shortcut (`.lnk`) instead of hunting for the
  real executable usually resolves this.
- **Chrome profile list is empty** — Chrome isn't installed, or its `Local
  State` file wasn't found at the expected location; use the manual
  profile-directory text field instead (e.g. `Default`, `Profile 1`).

## What's out of scope for this version

Mouse/keyboard automation, arbitrary shell/PowerShell execution, AI-driven
task control, running the agent as a Windows Service, cloud sync/auth, and
database storage were all deliberately left out. `ITaskExecutor` and the
`TaskType` enum are structured so a new task type is a small, additive
change when one is wanted. "Start application with Windows" / "Start
minimized" (Settings → General) currently only persist as preferences — they
don't yet register a second Windows autostart entry for the UI window itself
(only the agent's own login task is wired up).
