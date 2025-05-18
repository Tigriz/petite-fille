import { DEBOUNCE_DELAY, type PendingNotification, type NotificationGroup, groupSimilarNotifications, type NtfyConfig } from "./utils";

let pendingNotifications: PendingNotification[] = [];
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

type NtfyHeaders = {
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  click?: string;  // Using 'click' to match ntfy's header name convention
};

export async function sendNtfy(
  config: NtfyConfig,
  title: string,
  body: string,
  headers: NtfyHeaders = {}
) {
  pendingNotifications.push({
    title,
    body,
    actionUrl: headers.click,
    timestamp: Date.now(),
    priority: headers.priority,
    tags: headers.tags
  });

  if (!debounceTimeout) {
    debounceTimeout = setTimeout(async () => {
      const groupedNotifications = groupSimilarNotifications(pendingNotifications);
      
      for (const group of groupedNotifications) {
        await sendNtfyImmediate(
          config,
          group.title,
          group.bodies.join("\n\n---\n\n"),
          {
            click: group.actionUrl,
            priority: group.priority,
            tags: group.tags
          }
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
  headers: NtfyHeaders = {}
) {
  const url = `${config.url}/${config.topic}`;
  
  // Build all headers in a single object
  const ntfyHeaders: Record<string, string> = {
    "Content-Type": "text/plain",
    "Title": title,
    "Markdown": "yes",
    "Priority": (headers.priority ?? 3).toString(),
    ...(headers.tags?.length ? { "Tags": headers.tags.join(',') } : {}),
    ...(headers.click ? { "Click": headers.click } : {}),
    ...(config.token 
      ? { "Authorization": `Bearer ${config.token}` }
      : config.user && config.pass
      ? { "Authorization": `Basic ${Buffer.from(`${config.user}:${config.pass}`).toString("base64")}` }
      : {})
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: ntfyHeaders,
    body,
  });

  if (!resp.ok) {
    console.error(`❌ ntfy push failed (${resp.status})`);
  } else {
    console.log("✅ ntfy pushed");
  }
} 