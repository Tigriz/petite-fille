import { DEBOUNCE_DELAY, type PendingNotification, type NotificationGroup, groupSimilarNotifications, type NtfyConfig } from "./utils";

let pendingNotifications: PendingNotification[] = [];
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

export async function sendNtfy(
  config: NtfyConfig,
  title: string,
  body: string,
  actionUrl?: string,
) {
  pendingNotifications.push({
    title,
    body,
    actionUrl,
    timestamp: Date.now()
  });

  if (!debounceTimeout) {
    debounceTimeout = setTimeout(async () => {
      const groupedNotifications = groupSimilarNotifications(pendingNotifications);
      
      for (const group of groupedNotifications) {
        await sendNtfyImmediate(
          config,
          group.title,
          group.bodies.join("\n\n---\n\n"),
          group.actionUrl,
        );
      }

      pendingNotifications = [];
      debounceTimeout = null;
    }, DEBOUNCE_DELAY);
  }
}

async function sendNtfyImmediate(
  config: NtfyConfig,
  title: string,
  body: string,
  actionUrl?: string,
) {
  const url = `${config.url}/${config.topic}`;
  const headers: Record<string, string> = {
    "Content-Type": "text/plain",
    Title: title,
    Markdown: "yes",
  };

  if (actionUrl) headers["Click"] = actionUrl;

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  } 
  else if (config.user && config.pass) {
    const creds = Buffer.from(`${config.user}:${config.pass}`).toString("base64");
    headers.Authorization = `Basic ${creds}`;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!resp.ok) {
    console.error(`❌ ntfy push failed (${resp.status})`);
  } else {
    console.log("✅ ntfy pushed");
  }
} 