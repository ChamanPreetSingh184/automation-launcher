import type { AutomationTask } from "@/types/automation";

/** Moves the item at fromIndex to targetIndex and renumbers every task's `order` to match its new position. */
export function reorderTasks(tasks: AutomationTask[], fromIndex: number, targetIndex: number): AutomationTask[] {
  const next = [...tasks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next.map((task, index) => ({ ...task, order: index }));
}
