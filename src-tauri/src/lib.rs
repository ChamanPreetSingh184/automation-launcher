mod agent;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(agent::AgentState::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_profiles,
            commands::get_profile,
            commands::save_profile,
            commands::delete_profile,
            commands::duplicate_profile,
            commands::get_settings,
            commands::save_settings,
            commands::list_chrome_profiles,
            commands::list_executions,
            commands::get_execution,
            commands::run_profile,
            commands::agent_status,
            commands::register_startup,
            commands::unregister_startup,
            commands::open_log_folder,
            commands::exit_agent,
            commands::restart_agent,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
