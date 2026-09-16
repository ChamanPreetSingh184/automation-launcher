import { useState } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TASK_TYPE_META } from "@/lib/taskMeta";
import { reorderTasks } from "@/lib/reorderTasks";
import type { AutomationTask } from "@/types/automation";

interface TaskListProps {
  tasks: AutomationTask[];
  onReorder: (tasks: AutomationTask[]) => void;
  onToggleEnabled: (taskId: string, enabled: boolean) => void;
  onEdit: (task: AutomationTask) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({ tasks, onReorder, onToggleEnabled, onEdit, onDelete }: TaskListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    onReorder(reorderTasks(tasks, dragIndex, targetIndex));
    setDragIndex(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task, index) => {
        const meta = TASK_TYPE_META[task.type];
        const Icon = meta.icon;
        return (
          <div
            key={task.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-card px-3 py-3 shadow-sm transition-opacity",
              !task.enabled && "opacity-60",
              dragIndex === index && "opacity-40",
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
            <Switch checked={task.enabled} onCheckedChange={(checked) => onToggleEnabled(task.id, checked)} />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{task.name}</p>
              <p className="text-xs text-muted-foreground">
                {meta.label}
                {task.delaySeconds > 0 && task.type !== "wait" ? ` · ${task.delaySeconds}s delay after` : ""}
                {task.type === "wait" ? ` · ${task.delaySeconds}s` : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
