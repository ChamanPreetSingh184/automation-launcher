import { useEffect } from "react";
import { useAgentStatusStore } from "@/stores/agentStatusStore";

const POLL_INTERVAL_MS = 4000;

/** Keeps the agent status store fresh for as long as the calling component is mounted. */
export function useAgentStatusPolling() {
  const refresh = useAgentStatusStore((s) => s.refresh);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);
}
