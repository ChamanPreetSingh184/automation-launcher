import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { ListChecks } from "lucide-react";
import { TaskList } from "@/features/tasks/TaskList";
import { AddEditTaskDialog } from "@/features/tasks/AddEditTaskDialog";
import { TaskStatusBadge } from "@/features/executions/StatusBadge";
import { useProfilesStore } from "@/stores/profilesStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRunProfile } from "@/hooks/useRunProfile";
import type { AutomationProfile, AutomationTask } from "@/types/automation";

export function ProfileEditorPage({ profileId }: { profileId: string }) {
  const { profiles, load, save } = useProfilesStore();
  const go = useNavigationStore((s) => s.go);
  const { isRunning, liveResults, run } = useRunProfile();

  const [profile, setProfile] = useState<AutomationProfile | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AutomationTask | undefined>(undefined);

  useEffect(() => {
    if (profiles.length === 0) load();
  }, [profiles.length, load]);

  useEffect(() => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) setProfile(found);
  }, [profiles, profileId]);

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  function update(patch: Partial<AutomationProfile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsDirty(true);
  }

  async function handleSave() {
    if (!profile) return;
    try {
      const saved = await save(profile);
      setProfile(saved);
      setIsDirty(false);
      toast.success("Profile saved");
    } catch (error) {
      toast.error("Could not save this profile", { description: String(error) });
    }
  }

  function openAddTask() {
    setEditingTask(undefined);
    setTaskDialogOpen(true);
  }

  function openEditTask(task: AutomationTask) {
    setEditingTask(task);
    setTaskDialogOpen(true);
  }

  function handleTaskSave(task: AutomationTask) {
    if (!profile) return;
    const exists = profile.tasks.some((t) => t.id === task.id);
    const tasks = exists ? profile.tasks.map((t) => (t.id === task.id ? task : t)) : [...profile.tasks, task];
    update({ tasks });
  }

  function handleTaskDelete(taskId: string) {
    if (!profile) return;
    update({ tasks: profile.tasks.filter((t) => t.id !== taskId) });
  }

  function handleToggleEnabled(taskId: string, enabled: boolean) {
    if (!profile) return;
    update({ tasks: profile.tasks.map((t) => (t.id === taskId ? { ...t, enabled } : t)) });
  }

  function handleReorder(tasks: AutomationTask[]) {
    update({ tasks });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => go({ page: "profiles" })} className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to profiles
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name">Profile name</Label>
              <Input
                id="profile-name"
                value={profile.name}
                onChange={(e) => update({ name: e.target.value })}
                className="max-w-md text-base font-semibold"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-description">Description</Label>
              <Textarea
                id="profile-description"
                value={profile.description}
                onChange={(e) => update({ description: e.target.value })}
                className="max-w-md"
                rows={2}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => run(profile)} disabled={isRunning || profile.tasks.length === 0}>
              <Play className="h-4 w-4" />
              Run Now
            </Button>
            <Button onClick={handleSave} disabled={!isDirty}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Startup Automation Tasks</h2>
          <Button size="sm" variant="outline" onClick={openAddTask}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {profile.tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            description="Add a task to launch an app, open a URL, start Chrome or Edge, or wait between steps."
            action={
              <Button onClick={openAddTask}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            <TaskList
              tasks={profile.tasks}
              onReorder={handleReorder}
              onToggleEnabled={handleToggleEnabled}
              onEdit={openEditTask}
              onDelete={handleTaskDelete}
            />
            {isRunning && (
              <div className="mt-2 flex flex-col gap-1.5 rounded-lg border bg-card/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Live progress</p>
                {profile.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{task.name}</span>
                    <TaskStatusBadge status={liveResults[task.id]?.status ?? "pending"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AddEditTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} task={editingTask} onSave={handleTaskSave} />
    </div>
  );
}
