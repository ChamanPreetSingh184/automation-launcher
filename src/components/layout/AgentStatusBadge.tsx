import { cn } from "@/lib/utils";
import { useAgentStatusStore } from "@/stores/agentStatusStore";

export function AgentStatusBadge() {
  const { status, isUnavailable } = useAgentStatusStore();

  const label = isUnavailable ? "Agent stopped" : status?.activeRun ? "Running a profile" : "Agent running";
  const dotClass = isUnavailable
    ? "bg-muted-foreground"
    : status?.activeRun
      ? "bg-blue-500 animate-pulse"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
