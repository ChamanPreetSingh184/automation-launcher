import { z } from "zod";
import { isValidTimeOfDay } from "@/lib/timeValidation";

export const taskTypeSchema = z.enum(["application", "url", "chrome", "edge", "wait"]);

export function isHttpUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const APPLICATION_FILE_PATTERN = /\.(exe|lnk)$/i;

export function isSupportedApplicationFile(value: string | undefined | null): boolean {
  return !!value && APPLICATION_FILE_PATTERN.test(value);
}

/** Backs the Add/Edit Task dialog. Only the fields relevant to `type` are required. */
export const taskFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    type: taskTypeSchema,
    delaySeconds: z.coerce.number().int().min(0, "Must be 0 or more").max(3600, "Must be 3600 or less"),
    applicationPath: z.string().trim().optional(),
    arguments: z.string().trim().optional(),
    url: z.string().trim().optional(),
    chromeExecutablePath: z.string().trim().optional(),
    chromeProfileDirectory: z.string().trim().optional(),
    edgeExecutablePath: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.type) {
      case "application":
        if (!data.applicationPath) {
          ctx.addIssue({
            code: "custom",
            path: ["applicationPath"],
            message: "Choose an application or shortcut to launch.",
          });
        } else if (!isSupportedApplicationFile(data.applicationPath)) {
          ctx.addIssue({
            code: "custom",
            path: ["applicationPath"],
            message: "Must be an .exe file or a .lnk shortcut.",
          });
        }
        break;
      case "url":
        if (!isHttpUrl(data.url)) {
          ctx.addIssue({ code: "custom", path: ["url"], message: "Enter a valid http:// or https:// URL." });
        }
        break;
      case "edge":
        if (!isHttpUrl(data.url)) {
          ctx.addIssue({ code: "custom", path: ["url"], message: "Enter a valid http:// or https:// URL." });
        }
        break;
      case "chrome":
        if (data.url && !isHttpUrl(data.url)) {
          ctx.addIssue({ code: "custom", path: ["url"], message: "Enter a valid http:// or https:// URL, or leave it blank." });
        }
        break;
      case "wait":
        if (data.delaySeconds <= 0) {
          ctx.addIssue({ code: "custom", path: ["delaySeconds"], message: "Enter a duration greater than 0." });
        }
        break;
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Profile name is required").max(80, "Keep it under 80 characters"),
  description: z.string().trim().max(300, "Keep it under 300 characters").optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const appThemeSchema = z.enum(["dark", "light", "system"]);

export const startupTriggerTypeSchema = z.enum(["login", "dailyAtTime"]);

export const settingsFormSchema = z
  .object({
    startWithWindows: z.boolean(),
    startMinimized: z.boolean(),
    startupAutomationEnabled: z.boolean(),
    startupProfileId: z.string().nullable(),
    startupTriggerType: startupTriggerTypeSchema,
    startupDelaySeconds: z.coerce.number().int().min(0, "Must be 0 or more").max(3600, "Must be 3600 or less"),
    startupDailyTime: z.string().nullable(),
    theme: appThemeSchema,
  })
  .superRefine((data, ctx) => {
    if (data.startupTriggerType === "dailyAtTime" && !isValidTimeOfDay(data.startupDailyTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["startupDailyTime"],
        message: "Enter a valid time (HH:MM, 24-hour).",
      });
    }
  });

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
