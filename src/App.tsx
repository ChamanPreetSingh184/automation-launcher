import { useEffect } from "react";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilesPage } from "@/pages/ProfilesPage";
import { ProfileEditorPage } from "@/pages/ProfileEditorPage";
import { ExecutionsPage } from "@/pages/ExecutionsPage";
import { ExecutionDetailPage } from "@/pages/ExecutionDetailPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAgentStatusPolling } from "@/hooks/useAgentStatusPolling";

function CurrentPage() {
  const view = useNavigationStore((s) => s.view);

  switch (view.page) {
    case "dashboard":
      return <DashboardPage />;
    case "profiles":
      return <ProfilesPage />;
    case "profile-editor":
      return <ProfileEditorPage profileId={view.profileId} />;
    case "executions":
      return <ExecutionsPage />;
    case "execution-detail":
      return <ExecutionDetailPage executionId={view.executionId} />;
    case "settings":
      return <SettingsPage />;
  }
}

function App() {
  const { settings, load } = useSettingsStore();
  const { setTheme } = useTheme();
  useAgentStatusPolling();

  useEffect(() => {
    load();
  }, [load]);

  // Settings.json is the source of truth for theme; sync it into next-themes once loaded.
  useEffect(() => {
    if (settings) setTheme(settings.theme);
  }, [settings, setTheme]);

  return (
    <AppShell>
      <CurrentPage />
    </AppShell>
  );
}

export default App;
