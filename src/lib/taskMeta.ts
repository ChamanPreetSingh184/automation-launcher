import { AppWindow, CircleDot, Compass, Globe, Timer, type LucideIcon } from "lucide-react";
import type { TaskType } from "@/types/automation";

export const TASK_TYPE_META: Record<TaskType, { label: string; icon: LucideIcon }> = {
  application: { label: "Application", icon: AppWindow },
  url: { label: "URL", icon: Globe },
  chrome: { label: "Chrome", icon: CircleDot },
  edge: { label: "Microsoft Edge", icon: Compass },
  wait: { label: "Wait", icon: Timer },
};
