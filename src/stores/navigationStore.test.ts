import { beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "./navigationStore";

describe("navigationStore", () => {
  beforeEach(() => {
    useNavigationStore.setState({ view: { page: "dashboard" } });
  });

  it("starts on the dashboard", () => {
    expect(useNavigationStore.getState().view).toEqual({ page: "dashboard" });
  });

  it("selecting a profile navigates to its editor with the right id", () => {
    useNavigationStore.getState().go({ page: "profile-editor", profileId: "profile-42" });

    const view = useNavigationStore.getState().view;
    expect(view.page).toBe("profile-editor");
    expect(view).toEqual({ page: "profile-editor", profileId: "profile-42" });
  });

  it("selecting an execution navigates to its detail view with the right id", () => {
    useNavigationStore.getState().go({ page: "execution-detail", executionId: "exec-7" });

    expect(useNavigationStore.getState().view).toEqual({ page: "execution-detail", executionId: "exec-7" });
  });

  it("navigating away from a profile editor replaces the previous view entirely", () => {
    useNavigationStore.getState().go({ page: "profile-editor", profileId: "profile-1" });
    useNavigationStore.getState().go({ page: "settings" });

    expect(useNavigationStore.getState().view).toEqual({ page: "settings" });
  });
});
