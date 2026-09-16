import { create } from "zustand";
import { ipc } from "@/lib/ipc";
import type { AgentStatus } from "@/types/automation";

interface AgentStatusState {
  status: AgentStatus | null;
  isUnavailable: boolean;
  refresh: () => Promise<void>;
}

export const useAgentStatusStore = create<AgentStatusState>((set) => ({
  status: null,
  isUnavailable: false,

  refresh: async () => {
    try {
      const status = await ipc.agentStatus();
      set({ status, isUnavailable: false });
    } catch {
      set({ status: null, isUnavailable: true });
    }
  },
}));
