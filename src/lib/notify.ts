import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

/** Best-effort OS notification - silently does nothing if permission is denied. */
export async function notifyDesktop(title: string, body: string) {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
    }
  } catch {
    // Desktop notifications are a nice-to-have; never let them break a run.
  }
}
