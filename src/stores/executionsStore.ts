import { create } from "zustand";
import { ipc } from "@/lib/ipc";
import type { ExecutionRecord } from "@/types/automation";

interface ExecutionsState {
  executions: ExecutionRecord[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addOrUpdate: (record: ExecutionRecord) => void;
}

export const useExecutionsStore = create<ExecutionsState>((set, get) => ({
  executions: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const executions = await ipc.listExecutions();
      set({ executions, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  addOrUpdate: (record) => {
    const existing = get().executions;
    const index = existing.findIndex((e) => e.id === record.id);
    const next = index >= 0 ? existing.map((e, i) => (i === index ? record : e)) : [record, ...existing];
    set({ executions: next });
  },
}));
