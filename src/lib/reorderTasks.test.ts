import { describe, expect, it } from "vitest";
import { reorderTasks } from "./reorderTasks";
import type { AutomationTask } from "@/types/automation";

function task(id: string, order: number): AutomationTask {
  return {
    id,
    name: id,
    type: "wait",
    enabled: true,
    delaySeconds: 0,
    configuration: {},
    order,
  };
}

describe("reorderTasks", () => {
  it("moves a task from one position to another", () => {
    const tasks = [task("a", 0), task("b", 1), task("c", 2)];

    const result = reorderTasks(tasks, 0, 2);

    expect(result.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("moving a task later shifts the ones in between up", () => {
    const tasks = [task("a", 0), task("b", 1), task("c", 2), task("d", 3)];

    const result = reorderTasks(tasks, 1, 3);

    expect(result.map((t) => t.id)).toEqual(["a", "c", "d", "b"]);
  });

  it("renumbers every task's order field to match its new index", () => {
    const tasks = [task("a", 0), task("b", 1), task("c", 2)];

    const result = reorderTasks(tasks, 2, 0);

    expect(result.map((t) => t.order)).toEqual([0, 1, 2]);
    expect(result.map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("does not mutate the original array", () => {
    const tasks = [task("a", 0), task("b", 1)];

    reorderTasks(tasks, 0, 1);

    expect(tasks.map((t) => t.id)).toEqual(["a", "b"]);
  });
});
