export type TaskType = "application" | "url" | "chrome" | "edge" | "wait";

export type TaskExecutionStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type ExecutionStatus = "running" | "completed" | "completedWithErrors" | "failed";

export type AppTheme = "dark" | "light" | "system";

export type StartupTriggerType = "login" | "dailyAtTime";

export interface TaskConfiguration {
  applicationPath?: string | null;
  arguments?: string | null;
  url?: string | null;
  chromeExecutablePath?: string | null;
  chromeProfileDirectory?: string | null;
  edgeExecutablePath?: string | null;
}

export interface AutomationTask {
  id: string;
  name: string;
  type: TaskType;
  enabled: boolean;
  /** Seconds to pause after this task finishes. For a WAIT task, this is also its own duration. */
  delaySeconds: number;
  configuration: TaskConfiguration;
  order: number;
}

export interface AutomationProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: AutomationTask[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  startWithWindows: boolean;
  startMinimized: boolean;
  startupAutomationEnabled: boolean;
  startupProfileId: string | null;
  startupTriggerType: StartupTriggerType;
  /** Only used when startupTriggerType is "login". */
  startupDelaySeconds: number;
  /** Only used when startupTriggerType is "dailyAtTime". 24-hour "HH:mm", e.g. "17:00". */
  startupDailyTime: string | null;
  theme: AppTheme;
}

export interface TaskExecutionResult {
  taskId: string;
  taskName: string;
  type: TaskType;
  status: TaskExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface ExecutionRecord {
  id: string;
  profileId: string;
  profileName: string;
  triggeredBy: "Manual" | "Startup";
  startedAt: string;
  completedAt: string | null;
  status: ExecutionStatus;
  taskResults: TaskExecutionResult[];
}

export interface ChromeProfileInfo {
  directoryName: string;
  displayName: string;
}

export interface AgentStatus {
  running: boolean;
  activeRun: boolean;
}
