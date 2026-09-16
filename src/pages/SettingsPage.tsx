import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { FolderOpen, RotateCw, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentStatusBadge } from "@/components/layout/AgentStatusBadge";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProfilesStore } from "@/stores/profilesStore";
import { ipc } from "@/lib/ipc";
import type { AppSettings, AppTheme } from "@/types/automation";

const APP_VERSION = "0.1.0";

export function SettingsPage() {
  const { settings, load, save } = useSettingsStore();
  const { profiles, load: loadProfiles } = useProfilesStore();
  const { setTheme } = useTheme();
  const [delayInput, setDelayInput] = useState("10");

  useEffect(() => {
    load();
    loadProfiles();
  }, [load, loadProfiles]);

  useEffect(() => {
    if (settings) setDelayInput(String(settings.startupDelaySeconds));
  }, [settings?.startupDelaySeconds]);

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  async function patch(next: Partial<AppSettings>) {
    try {
      await save({ ...settings!, ...next });
    } catch (error) {
      toast.error("Could not save settings", { description: String(error) });
    }
  }

  async function handleToggleStartupEnabled(enabled: boolean) {
    if (!settings!.startupProfileId) {
      toast.error("Choose a startup profile first");
      return;
    }
    try {
      if (enabled) {
        await ipc.registerStartup();
      } else {
        await ipc.unregisterStartup();
      }
      await patch({ startupAutomationEnabled: enabled });
      toast.success(enabled ? "Startup automation enabled" : "Startup automation disabled");
    } catch (error) {
      toast.error("Could not update startup automation", { description: String(error) });
    }
  }

  async function handleThemeChange(theme: AppTheme) {
    setTheme(theme);
    await patch({ theme });
  }

  async function handleRestartAgent() {
    try {
      await ipc.restartAgent();
      toast.success("Agent restarted");
    } catch (error) {
      toast.error("Could not restart the agent", { description: String(error) });
    }
  }

  async function handleExitAgent() {
    try {
      await ipc.exitAgent();
      toast.success("Agent stopped. It will start again the next time it's needed.");
    } catch (error) {
      toast.error("Could not stop the agent", { description: String(error) });
    }
  }

  async function handleOpenLogFolder() {
    try {
      await ipc.openLogFolder();
    } catch (error) {
      toast.error("Could not open the log folder", { description: String(error) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure the app and the automation agent.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="startup">Startup</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="divide-y p-0">
            <SettingRow
              label="Start application with Windows"
              description="Open the Automation Launcher window automatically when you sign in."
            >
              <Switch
                checked={settings.startWithWindows}
                onCheckedChange={(checked) => patch({ startWithWindows: checked })}
              />
            </SettingRow>
            <SettingRow label="Start minimized" description="Open in the background instead of a visible window.">
              <Switch
                checked={settings.startMinimized}
                onCheckedChange={(checked) => patch({ startMinimized: checked })}
              />
            </SettingRow>
          </Card>
        </TabsContent>

        <TabsContent value="startup" className="mt-4">
          <Card className="divide-y p-0">
            <SettingRow
              label="Enable startup automation"
              description="Run your startup profile automatically after Windows login."
            >
              <Switch checked={settings.startupAutomationEnabled} onCheckedChange={handleToggleStartupEnabled} />
            </SettingRow>
            <SettingRow label="Startup profile" description="Which profile runs at login.">
              <Select
                value={settings.startupProfileId ?? undefined}
                onValueChange={(id) => patch({ startupProfileId: id })}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Choose a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Startup delay (seconds)" description="How long to wait after login before running.">
              <Input
                type="number"
                min={0}
                max={3600}
                value={delayInput}
                onChange={(e) => setDelayInput(e.target.value)}
                onBlur={() => patch({ startupDelaySeconds: Number(delayInput) || 0 })}
                className="w-24"
              />
            </SettingRow>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card className="divide-y p-0">
            <SettingRow label="Theme" description="Dark, light, or match your Windows setting.">
              <Select value={settings.theme} onValueChange={(v) => handleThemeChange(v as AppTheme)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Agent status</p>
                <p className="text-xs text-muted-foreground">Version {APP_VERSION}</p>
              </div>
              <AgentStatusBadge />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRestartAgent}>
                <RotateCw className="h-4 w-4" />
                Restart agent
              </Button>
              <Button variant="outline" onClick={handleExitAgent}>
                <LogOut className="h-4 w-4" />
                Exit agent
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium">Log files</p>
              <p className="text-xs text-muted-foreground">One file per day, stored under %APPDATA%\AutomationLauncher\logs</p>
            </div>
            <Button variant="outline" onClick={handleOpenLogFolder}>
              <FolderOpen className="h-4 w-4" />
              Open log folder
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
