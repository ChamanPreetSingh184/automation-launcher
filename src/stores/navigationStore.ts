import { create } from "zustand";

export type View =
  | { page: "dashboard" }
  | { page: "profiles" }
  | { page: "profile-editor"; profileId: string | "new" }
  | { page: "executions" }
  | { page: "execution-detail"; executionId: string }
  | { page: "settings" };

interface NavigationState {
  view: View;
  go: (view: View) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  view: { page: "dashboard" },
  go: (view) => set({ view }),
}));
