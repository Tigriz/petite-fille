import { DEBOUNCE_DELAY, type PendingNotification, type NotificationGroup, groupSimilarNotifications } from "./utils";
import { type NtfyInstanceConfig } from "./config";

// Track pending notifications and debounce timers per configuration
const pendingNotificationsByConfig = new Map<NtfyInstanceConfig, PendingNotification[]>();
const debounceTimersByConfig = new Map<NtfyInstanceConfig, ReturnType<typeof setTimeout> | null>();

type NtfyHeaders = {
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  click?: string;  // Using 'click' to match ntfy's header name convention
};

export async function sendNtfyToAll(
  configs: NtfyInstanceConfig[],
  title: string,
  body: string,
  headers: NtfyHeaders = {}
) {
  for (const cfg of configs) {
    try {
      await sendNtfy(cfg, title, body, headers);
      console.log(`✅ ntfy pushed to ${cfg.name}`);
    } catch (error) {
      console.error(`❌ ntfy push failed for ${cfg.name}:`, error);
    }
  }
}

export async function sendNtfy(
  config: NtfyInstanceConfig,
  title: string,
  body: string,
  headers: NtfyHeaders = {}
) {
  // Get or create pending notifications array for this config
  if (!pendingNotificationsByConfig.has(config)) {
    pendingNotificationsByConfig.set(config, []);
  }
  const pendingNotifications = pendingNotificationsByConfig.get(config)!;

  // Add notification to this config's pending list
  pendingNotifications.push({
    title,
    body,
    actionUrl: headers.click,
    timestamp: Date.now(),
    priority: headers.priority,
    tags: headers.tags,
    config: config
  });

  // Get or create debounce timer for this config
  if (!debounceTimersByConfig.has(config)) {
    debounceTimersByConfig.set(config, null);
  }
  let debounceTimer = debounceTimersByConfig.get(config);

  // Clear existing timer if it exists
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new debounce timer for this config
  debounceTimer = setTimeout(async () => {
    const groupedNotifications = groupSimilarNotifications(pendingNotifications);
    
    // Send all grouped notifications for this config
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

    // Clear this config's pending notifications and timer
    pendingNotificationsByConfig.set(config, []);
    debounceTimersByConfig.set(config, null);
  }, DEBOUNCE_DELAY);

  debounceTimersByConfig.set(config, debounceTimer);
}

async function sendNtfyImmediate(
  config: NtfyInstanceConfig,
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
    ...(config.auth.type === "token" && config.auth.token
      ? { "Authorization": `Bearer ${config.auth.token}` }
      : config.auth.type === "basic" && config.auth.user && config.auth.pass
      ? { "Authorization": `Basic ${Buffer.from(`${config.auth.user}:${config.auth.pass}`).toString("base64")}` }
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