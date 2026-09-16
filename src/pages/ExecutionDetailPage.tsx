import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExecutionStatusBadge, TaskStatusBadge } from "@/features/executions/StatusBadge";
import { TASK_TYPE_META } from "@/lib/taskMeta";
import { formatDateTime, formatDuration } from "@/lib/formatting";
import { ipc } from "@/lib/ipc";
import { useNavigationStore } from "@/stores/navigationStore";
import type { ExecutionRecord } from "@/types/automation";

export function ExecutionDetailPage({ executionId }: { executionId: string }) {
  const go = useNavigationStore((s) => s.go);
  const [execution, setExecution] = useState<ExecutionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ipc
      .getExecution(executionId)
      .then(setExecution)
      .catch((e) => setError(String(e)));
  }, [executionId]);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => go({ page: "executions" })} className="-ml-2 w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {execution && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{execution.profileName}</h1>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(execution.startedAt)} · {execution.triggeredBy} ·{" "}
                {formatDuration(execution.startedAt, execution.completedAt)}
              </p>
            </div>
            <ExecutionStatusBadge status={execution.status} />
          </div>

          <div className="flex flex-col gap-2">
            {execution.taskResults.map((result) => {
              const Icon = TASK_TYPE_META[result.type].icon;
              return (
                <Card key={result.taskId} className="flex flex-col gap-1 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{result.taskName}</span>
                    </div>
                    <TaskStatusBadge status={result.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.startedAt ? formatDateTime(result.startedAt) : "Not started"}
                    {result.startedAt && ` · ${formatDuration(result.startedAt, result.completedAt)}`}
                  </p>
                  {result.errorMessage && <p className="text-sm text-destructive">{result.errorMessage}</p>}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
