import { describe, expect, it } from "vitest";
import { isHttpUrl, profileFormSchema, settingsFormSchema, taskFormSchema } from "./automation";

describe("isHttpUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects non-http(s) schemes and malformed input", () => {
    expect(isHttpUrl("ftp://example.com")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
    expect(isHttpUrl(undefined)).toBe(false);
  });
});

describe("taskFormSchema", () => {
  const base = {
    name: "My task",
    type: "application" as const,
    delaySeconds: 0,
  };

  it("requires a name", () => {
    const result = taskFormSchema.safeParse({ ...base, name: "  " });
    expect(result.success).toBe(false);
  });

  it("requires an application path for APPLICATION tasks", () => {
    const result = taskFormSchema.safeParse({ ...base, applicationPath: "" });
    expect(result.success).toBe(false);
  });

  it("accepts an APPLICATION task with an .exe path", () => {
    const result = taskFormSchema.safeParse({ ...base, applicationPath: "C:/apps/tool.exe" });
    expect(result.success).toBe(true);
  });

  it("accepts an APPLICATION task with a .lnk shortcut path", () => {
    const result = taskFormSchema.safeParse({
      ...base,
      applicationPath: "C:/Users/me/Desktop/Outlook.lnk",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an APPLICATION path with an unsupported extension", () => {
    const result = taskFormSchema.safeParse({ ...base, applicationPath: "C:/apps/notes.txt" });
    expect(result.success).toBe(false);
  });

  it("requires a valid URL for URL tasks", () => {
    expect(taskFormSchema.safeParse({ ...base, type: "url", url: "not-a-url" }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...base, type: "url", url: "https://example.com" }).success).toBe(true);
  });

  it("requires a valid URL for EDGE tasks but not for CHROME tasks", () => {
    expect(taskFormSchema.safeParse({ ...base, type: "edge", url: "" }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...base, type: "chrome", url: "" }).success).toBe(true);
    expect(taskFormSchema.safeParse({ ...base, type: "chrome", url: "not-a-url" }).success).toBe(false);
  });

  it("requires a positive duration for WAIT tasks", () => {
    expect(taskFormSchema.safeParse({ ...base, type: "wait", delaySeconds: 0 }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...base, type: "wait", delaySeconds: 5 }).success).toBe(true);
  });

  it("rejects a delay outside the allowed range", () => {
    expect(taskFormSchema.safeParse({ ...base, delaySeconds: -1 }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...base, delaySeconds: 3601 }).success).toBe(false);
  });
});

describe("profileFormSchema", () => {
  it("requires a non-empty name", () => {
    expect(profileFormSchema.safeParse({ name: "" }).success).toBe(false);
    expect(profileFormSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("accepts a valid name with an optional description", () => {
    expect(profileFormSchema.safeParse({ name: "Morning routine" }).success).toBe(true);
    expect(profileFormSchema.safeParse({ name: "Morning routine", description: "Coffee and email" }).success).toBe(
      true,
    );
  });
});

describe("settingsFormSchema", () => {
  const valid = {
    startWithWindows: false,
    startMinimized: false,
    startupAutomationEnabled: true,
    startupProfileId: "abc123",
    startupDelaySeconds: 10,
    theme: "dark" as const,
  };

  it("accepts a fully valid settings object", () => {
    expect(settingsFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown theme", () => {
    expect(settingsFormSchema.safeParse({ ...valid, theme: "purple" }).success).toBe(false);
  });

  it("rejects a startup delay outside the allowed range", () => {
    expect(settingsFormSchema.safeParse({ ...valid, startupDelaySeconds: -5 }).success).toBe(false);
  });
});
