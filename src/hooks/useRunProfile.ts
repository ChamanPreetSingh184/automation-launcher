import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ipc, onTaskUpdate } from "@/lib/ipc";
import { notifyDesktop } from "@/lib/notify";
import { useExecutionsStore } from "@/stores/executionsStore";
import { useAgentStatusStore } from "@/stores/agentStatusStore";
import type { AutomationProfile, TaskExecutionResult } from "@/types/automation";

export function useRunProfile() {
  const [isRunning, setIsRunning] = useState(false);
  const [liveResults, setLiveResults] = useState<Record<string, TaskExecutionResult>>({});
  const addOrUpdate = useExecutionsStore((s) => s.addOrUpdate);
  const refreshAgentStatus = useAgentStatusStore((s) => s.refresh);

  const run = useCallback(
    async (profile: AutomationProfile) => {
      setIsRunning(true);
      setLiveResults({});
      const unlisten = await onTaskUpdate((result) => {
        setLiveResults((prev) => ({ ...prev, [result.taskId]: result }));
      });

      try {
        const record = await ipc.runProfile(profile.id);
        addOrUpdate(record);

        if (record.status === "completed") {
          toast.success(`${profile.name} finished`, {
            description: `${record.taskResults.length} task(s) completed successfully.`,
          });
          notifyDesktop("Automation Launcher", `${profile.name} finished successfully.`);
        } else {
          toast.warning(`${profile.name} finished with errors`, {
            description: "Open Execution History for details.",
          });
          notifyDesktop("Automation Launcher", `${profile.name} finished with errors.`);
        }
      } catch (error) {
        toast.error("Could not run this profile", { description: String(error) });
      } finally {
        unlisten();
        setIsRunning(false);
        refreshAgentStatus();
      }
    },
    [addOrUpdate, refreshAgentStatus],
  );

  return { isRunning, liveResults, run };
}
