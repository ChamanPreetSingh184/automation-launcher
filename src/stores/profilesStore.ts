import { create } from "zustand";
import { ipc } from "@/lib/ipc";
import type { AutomationProfile } from "@/types/automation";

interface ProfilesState {
  profiles: AutomationProfile[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (profile: AutomationProfile) => Promise<AutomationProfile>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await ipc.listProfiles();
      set({ profiles, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  save: async (profile) => {
    const saved = await ipc.saveProfile(profile);
    const existing = get().profiles;
    const index = existing.findIndex((p) => p.id === saved.id);
    const next = index >= 0 ? existing.map((p, i) => (i === index ? saved : p)) : [...existing, saved];
    set({ profiles: next });
    return saved;
  },

  remove: async (id) => {
    await ipc.deleteProfile(id);
    set({ profiles: get().profiles.filter((p) => p.id !== id) });
  },

  duplicate: async (id) => {
    const copy = await ipc.duplicateProfile(id);
    set({ profiles: [...get().profiles, copy] });
  },
}));
