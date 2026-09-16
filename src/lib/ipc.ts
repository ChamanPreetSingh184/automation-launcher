import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  AgentStatus,
  AppSettings,
  AutomationProfile,
  ChromeProfileInfo,
  ExecutionRecord,
  TaskExecutionResult,
} from "@/types/automation";

/**
 * Every function here calls one Tauri command, which forwards to the single
 * running AutomationAgent process. All automation logic lives in the agent -
 * this file only shapes the request/response types.
 */
export const ipc = {
  listProfiles: () => invoke<AutomationProfile[]>("list_profiles"),
  getProfile: (id: string) => invoke<AutomationProfile>("get_profile", { id }),
  saveProfile: (profile: AutomationProfile) => invoke<AutomationProfile>("save_profile", { profile }),
  deleteProfile: (id: string) => invoke<{ deleted: boolean }>("delete_profile", { id }),
  duplicateProfile: (id: string) => invoke<AutomationProfile>("duplicate_profile", { id }),

  getSettings: () => invoke<AppSettings>("get_settings"),
  saveSettings: (settings: AppSettings) => invoke<AppSettings>("save_settings", { settings }),

  listChromeProfiles: () => invoke<ChromeProfileInfo[]>("list_chrome_profiles"),

  listExecutions: () => invoke<ExecutionRecord[]>("list_executions"),
  getExecution: (id: string) => invoke<ExecutionRecord>("get_execution", { id }),

  runProfile: (profileId: string) => invoke<ExecutionRecord>("run_profile", { profileId }),

  agentStatus: () => invoke<AgentStatus>("agent_status"),

  registerStartup: () => invoke<{ registered: boolean }>("register_startup"),
  unregisterStartup: () => invoke<{ registered: boolean }>("unregister_startup"),

  openLogFolder: () => invoke<{ opened: boolean }>("open_log_folder"),
  exitAgent: () => invoke<{ shuttingDown: boolean }>("exit_agent"),
  restartAgent: () => invoke<unknown>("restart_agent"),
};

interface AgentEventMessage {
  type: "event";
  event: string;
  runId: string | null;
  data: unknown;
}

/** Subscribes to every unsolicited message from the agent (currently just task-update). */
function onAgentEvent(handler: (event: AgentEventMessage) => void) {
  return listen<AgentEventMessage>("agent-event", (e) => handler(e.payload));
}

/** Subscribes to live task status updates while a profile is running. */
export function onTaskUpdate(handler: (result: TaskExecutionResult) => void) {
  return onAgentEvent((event) => {
    if (event.event === "task-update") {
      handler(event.data as TaskExecutionResult);
    }
  });
}
