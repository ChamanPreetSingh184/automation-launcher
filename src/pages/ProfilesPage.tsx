import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { ProfileCard } from "@/features/profiles/ProfileCard";
import { CreateProfileDialog } from "@/features/profiles/CreateProfileDialog";
import { useProfilesStore } from "@/stores/profilesStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRunProfile } from "@/hooks/useRunProfile";
import type { AutomationProfile } from "@/types/automation";

export function ProfilesPage() {
  const { profiles, load, remove, duplicate } = useProfilesStore();
  const { settings, load: loadSettings, save: saveSettings } = useSettingsStore();
  const go = useNavigationStore((s) => s.go);
  const { isRunning, run } = useRunProfile();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AutomationProfile | null>(null);

  useEffect(() => {
    load();
    loadSettings();
  }, [load, loadSettings]);

  async function handleCreate(profile: AutomationProfile) {
    const saved = await useProfilesStore.getState().save(profile);
    setCreateOpen(false);
    go({ page: "profile-editor", profileId: saved.id });
    toast.success(`Created ${saved.name}`);
  }

  async function handleSetStartup(profile: AutomationProfile) {
    if (!settings) return;
    try {
      await saveSettings({ ...settings, startupProfileId: profile.id, startupAutomationEnabled: true });
      toast.success(`${profile.name} is now the startup profile`);
    } catch (error) {
      toast.error("Could not set the startup profile", { description: String(error) });
    }
  }

  async function handleDuplicate(profile: AutomationProfile) {
    try {
      await duplicate(profile.id);
      toast.success(`Duplicated ${profile.name}`);
    } catch (error) {
      toast.error("Could not duplicate this profile", { description: String(error) });
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete.id);
      toast.success(`Deleted ${pendingDelete.name}`);
      setPendingDelete(null);
    } catch (error) {
      toast.error("Could not delete this profile", { description: String(error) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
          <p className="text-sm text-muted-foreground">Automation profiles you can run manually or at login.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No profiles yet"
          description="Create your first automation profile to start launching apps, sites and browsers automatically."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Profile
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isStartupProfile={settings?.startupProfileId === profile.id}
              isRunning={isRunning}
              onOpen={() => go({ page: "profile-editor", profileId: profile.id })}
              onRun={() => run(profile)}
              onDuplicate={() => handleDuplicate(profile)}
              onDelete={() => setPendingDelete(profile)}
              onSetStartup={() => handleSetStartup(profile)}
            />
          ))}
        </div>
      )}

      <CreateProfileDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the profile and its tasks. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
