import { useEffect } from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { ExecutionStatusBadge } from "@/features/executions/StatusBadge";
import { useExecutionsStore } from "@/stores/executionsStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { formatDateTime, formatDuration } from "@/lib/formatting";

export function ExecutionsPage() {
  const { executions, load } = useExecutionsStore();
  const go = useNavigationStore((s) => s.go);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Execution History</h1>
        <p className="text-sm text-muted-foreground">Every time a profile ran, manually or at login.</p>
      </div>

      {executions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No executions yet"
          description="Run a profile to see its execution history here."
        />
      ) : (
        <Card className="divide-y p-0">
          {executions.map((execution) => (
            <button
              key={execution.id}
              type="button"
              onClick={() => go({ page: "execution-detail", executionId: execution.id })}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{execution.profileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(execution.startedAt)} · {execution.triggeredBy}
                </p>
              </div>
              <span className="w-20 shrink-0 text-sm text-muted-foreground">
                {formatDuration(execution.startedAt, execution.completedAt)}
              </span>
              <span className="w-24 shrink-0 text-sm text-muted-foreground">
                {execution.taskResults.length} task{execution.taskResults.length === 1 ? "" : "s"}
              </span>
              <ExecutionStatusBadge status={execution.status} />
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
