import { useEffect, useState } from "react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen } from "lucide-react";
import { taskFormSchema, type TaskFormValues } from "@/schemas/automation";
import { TASK_TYPE_META } from "@/lib/taskMeta";
import { ipc } from "@/lib/ipc";
import type { AutomationTask, ChromeProfileInfo, TaskType } from "@/types/automation";

const TASK_TYPES: TaskType[] = ["application", "url", "chrome", "edge", "wait"];

function defaultValues(task?: AutomationTask): TaskFormValues {
  return {
    name: task?.name ?? "",
    type: task?.type ?? "application",
    delaySeconds: task?.delaySeconds ?? 0,
    applicationPath: task?.configuration.applicationPath ?? "",
    arguments: task?.configuration.arguments ?? "",
    url: task?.configuration.url ?? "",
    chromeExecutablePath: task?.configuration.chromeExecutablePath ?? "",
    chromeProfileDirectory: task?.configuration.chromeProfileDirectory ?? "",
    edgeExecutablePath: task?.configuration.edgeExecutablePath ?? "",
  };
}

function buildTask(existing: AutomationTask | undefined, values: TaskFormValues): AutomationTask {
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name,
    type: values.type,
    enabled: existing?.enabled ?? true,
    delaySeconds: values.delaySeconds,
    order: existing?.order ?? 0,
    configuration: {
      applicationPath: values.type === "application" ? values.applicationPath || null : null,
      arguments: values.type === "application" ? values.arguments || null : null,
      url: ["url", "chrome", "edge"].includes(values.type) ? values.url || null : null,
      chromeExecutablePath: values.type === "chrome" ? values.chromeExecutablePath || null : null,
      chromeProfileDirectory: values.type === "chrome" ? values.chromeProfileDirectory || null : null,
      edgeExecutablePath: values.type === "edge" ? values.edgeExecutablePath || null : null,
    },
  };
}

interface AddEditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: AutomationTask;
  onSave: (task: AutomationTask) => void;
}

export function AddEditTaskDialog({ open, onOpenChange, task, onSave }: AddEditTaskDialogProps) {
  const [values, setValues] = useState<TaskFormValues>(() => defaultValues(task));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [chromeProfiles, setChromeProfiles] = useState<ChromeProfileInfo[] | null>(null);

  useEffect(() => {
    if (open) {
      setValues(defaultValues(task));
      setErrors({});
    }
  }, [open, task]);

  useEffect(() => {
    if (open && values.type === "chrome" && chromeProfiles === null) {
      ipc
        .listChromeProfiles()
        .then(setChromeProfiles)
        .catch(() => setChromeProfiles([]));
    }
  }, [open, values.type, chromeProfiles]);

  function set<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function browseForApplication() {
    const selected = await openFileDialog({
      multiple: false,
      filters: [
        { name: "Executable (*.exe)", extensions: ["exe"] },
        { name: "Shortcut (*.lnk)", extensions: ["lnk"] },
      ],
    });
    if (typeof selected === "string") {
      set("applicationPath", selected);
    }
  }

  function handleSave() {
    const result = taskFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSave(buildTask(task, result.data));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>Choose what this step should do when the profile runs.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-type">Task type</Label>
            <Select value={values.type} onValueChange={(v) => set("type", v as TaskType)}>
              <SelectTrigger id="task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TASK_TYPE_META[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={TASK_TYPE_META[values.type].label}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {values.type === "application" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="app-path">Application or shortcut</Label>
                <div className="flex gap-2">
                  <Input
                    id="app-path"
                    value={values.applicationPath}
                    onChange={(e) => set("applicationPath", e.target.value)}
                    placeholder="C:\Program Files\... .exe or a .lnk shortcut"
                  />
                  <Button type="button" variant="outline" onClick={browseForApplication}>
                    <FolderOpen className="h-4 w-4" />
                    Browse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pick an .exe directly, or a .lnk shortcut (e.g. from your desktop) - useful for apps whose real
                  executable is hard to find, like Store-installed apps.
                </p>
                {errors.applicationPath && <p className="text-sm text-destructive">{errors.applicationPath}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app-args">Arguments (optional)</Label>
                <Input id="app-args" value={values.arguments} onChange={(e) => set("arguments", e.target.value)} />
              </div>
            </>
          )}

          {values.type === "url" && (
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={values.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://example.com"
              />
              {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
            </div>
          )}

          {values.type === "edge" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edge-url">URL</Label>
                <Input
                  id="edge-url"
                  value={values.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://example.com"
                />
                {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edge-path">Edge executable path (optional)</Label>
                <Input
                  id="edge-path"
                  value={values.edgeExecutablePath}
                  onChange={(e) => set("edgeExecutablePath", e.target.value)}
                  placeholder="Leave blank to use the default install location"
                />
              </div>
            </>
          )}

          {values.type === "chrome" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="chrome-url">URL (optional)</Label>
                <Input
                  id="chrome-url"
                  value={values.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://example.com"
                />
                {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chrome-profile">Chrome profile (optional)</Label>
                {chromeProfiles && chromeProfiles.length > 0 ? (
                  <Select
                    value={values.chromeProfileDirectory || undefined}
                    onValueChange={(v) => set("chromeProfileDirectory", v)}
                  >
                    <SelectTrigger id="chrome-profile">
                      <SelectValue placeholder="Use Chrome's default profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {chromeProfiles.map((p) => (
                        <SelectItem key={p.directoryName} value={p.directoryName}>
                          {p.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="chrome-profile"
                    value={values.chromeProfileDirectory}
                    onChange={(e) => set("chromeProfileDirectory", e.target.value)}
                    placeholder="e.g. Default, Profile 1 (leave blank for default)"
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chrome-path">Chrome executable path (optional)</Label>
                <Input
                  id="chrome-path"
                  value={values.chromeExecutablePath}
                  onChange={(e) => set("chromeExecutablePath", e.target.value)}
                  placeholder="Leave blank to use the default install location"
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="delay">{values.type === "wait" ? "Duration (seconds)" : "Delay after this task (seconds)"}</Label>
            <Input
              id="delay"
              type="number"
              min={0}
              max={3600}
              value={values.delaySeconds}
              onChange={(e) => set("delaySeconds", Number(e.target.value))}
            />
            {errors.delaySeconds && <p className="text-sm text-destructive">{errors.delaySeconds}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
