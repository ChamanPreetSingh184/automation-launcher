import { useEffect } from "react";
import { CheckCircle2, ListChecks, Play, Star, Workflow, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExecutionStatusBadge } from "@/features/executions/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { useProfilesStore } from "@/stores/profilesStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useExecutionsStore } from "@/stores/executionsStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRunProfile } from "@/hooks/useRunProfile";
import { formatDateTime, formatDuration } from "@/lib/formatting";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

export function DashboardPage() {
  const { profiles, load: loadProfiles } = useProfilesStore();
  const { settings, load: loadSettings } = useSettingsStore();
  const { executions, load: loadExecutions } = useExecutionsStore();
  const go = useNavigationStore((s) => s.go);
  const { isRunning, run } = useRunProfile();

  useEffect(() => {
    loadProfiles();
    loadSettings();
    loadExecutions();
  }, [loadProfiles, loadSettings, loadExecutions]);

  const startupProfile = profiles.find((p) => p.id === settings?.startupProfileId) ?? null;
  const quickRunProfile = startupProfile ?? profiles[0] ?? null;
  const totalTasks = profiles.reduce((sum, p) => sum + p.tasks.length, 0);
  const recentExecutions = executions.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of your automation setup.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Profiles" value={profiles.length} />
        <StatCard label="Configured tasks" value={totalTasks} />
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Startup automation</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold tracking-tight">
            {settings?.startupAutomationEnabled ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            {settings?.startupAutomationEnabled ? "Enabled" : "Off"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Startup profile</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{startupProfile?.name ?? "None set"}</p>
        </Card>
      </div>

      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Play className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Quick Run</p>
            <p className="text-xs text-muted-foreground">Runs your startup profile, or pick another one below.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profiles.length > 0 && (
            <Select
              value={quickRunProfile?.id}
              onValueChange={(id) => go({ page: "profile-editor", profileId: id })}
            >
              <SelectTrigger className="w-48">
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
          )}
          <Button
            onClick={() => quickRunProfile && run(quickRunProfile)}
            disabled={!quickRunProfile || isRunning || quickRunProfile.tasks.length === 0}
          >
            <Play className="h-4 w-4" />
            Run Now
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Recent Executions</h2>
        {recentExecutions.length === 0 ? (
          <EmptyState icon={ListChecks} title="No executions yet" description="Run a profile to see it here." />
        ) : (
          <Card className="divide-y p-0">
            {recentExecutions.map((execution) => (
              <button
                key={execution.id}
                type="button"
                onClick={() => go({ page: "execution-detail", executionId: execution.id })}
                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{execution.profileName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(execution.startedAt)}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(execution.startedAt, execution.completedAt)}
                </span>
                <ExecutionStatusBadge status={execution.status} />
              </button>
            ))}
          </Card>
        )}
      </div>

      {profiles.length === 0 && (
        <EmptyState
          icon={Workflow}
          title="No profiles yet"
          description="Create your first automation profile to get started."
          action={
            <Button onClick={() => go({ page: "profiles" })}>
              <Star className="h-4 w-4" />
              Go to Profiles
            </Button>
          }
        />
      )}
    </div>
  );
}
