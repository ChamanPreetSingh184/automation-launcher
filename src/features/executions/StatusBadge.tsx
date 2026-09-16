import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExecutionStatus, TaskExecutionStatus } from "@/types/automation";

const EXECUTION_STYLES: Record<ExecutionStatus, string> = {
  running: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  completedWithErrors: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const EXECUTION_LABELS: Record<ExecutionStatus, string> = {
  running: "Running",
  completed: "Completed",
  completedWithErrors: "Completed with errors",
  failed: "Failed",
};

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", EXECUTION_STYLES[status])}>
      {EXECUTION_LABELS[status]}
    </Badge>
  );
}

const TASK_STYLES: Record<TaskExecutionStatus, string> = {
  pending: "bg-muted text-muted-foreground border-transparent",
  running: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  skipped: "bg-muted text-muted-foreground border-transparent",
};

const TASK_LABELS: Record<TaskExecutionStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

export function TaskStatusBadge({ status }: { status: TaskExecutionStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", TASK_STYLES[status])}>
      {TASK_LABELS[status]}
    </Badge>
  );
}
