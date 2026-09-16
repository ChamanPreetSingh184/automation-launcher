import { create } from "zustand";
import { ipc } from "@/lib/ipc";
import type { AppSettings } from "@/types/automation";

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (settings: AppSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await ipc.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  save: async (settings) => {
    const saved = await ipc.saveSettings(settings);
    set({ settings: saved });
  },
}));
