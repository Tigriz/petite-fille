import { config as loadEnv } from "dotenv";
import { loadConfig, getCurrentConfig, onConfigChange, onConfigReload, startConfigWatcher, type NtfyInstanceConfig } from "./config";
import { isMessageOrEdit, type EditEvent, type MessageEvent, type WsEvent } from "../types/events";
import { formatNotificationBody } from "./utils";
import { sendNtfy, sendNtfyToAll } from "./notifications";
import { setLocale, t } from "./i18n";

loadEnv();

const { BASE_URL, WS_URL, LOCALE = "en" } = process.env;
if (!WS_URL) {
  console.error(t("errors.missingEnvVars"));
  process.exit(1);
}

// Extract site name from BASE_URL (e.g., "village.cx" from "https://village.cx")
const siteName = BASE_URL ? new URL(BASE_URL).hostname : "village.cx";

setLocale(LOCALE as "en" | "fr");

// Load initial config
let ntfyConfigs: NtfyInstanceConfig[] = loadConfig();

console.log(`📡 Loaded ${ntfyConfigs.length} ntfy configuration(s):`);
ntfyConfigs.forEach(cfg => {
  console.log(`  - ${cfg.name}: ${cfg.url}/${cfg.topic} (${cfg.auth.type} auth)`);
});

// Start config watcher for hot reload
startConfigWatcher();

// Register config change callback
onConfigChange((newConfig) => {
  ntfyConfigs = newConfig;
  console.log('🔄 Updated to new configuration');
});

// Register config reload callback for system notifications
onConfigReload(async (newConfig) => {
  await sendNtfyToAll(
    newConfig,
    t("notifications.configReloaded"),
    t("notifications.configReloadedBody", { 
      configCount: newConfig.length,
      configNames: newConfig.map(cfg => cfg.name).join(", ")
    }),
    {
      priority: 2,
      tags: ['gear', 'system']
    }
  );
});

const PING_INTERVAL_MS = 60_000;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 300_000; // 5 minutes
const RETRY_BACKOFF_FACTOR = 2;

let pingInterval: ReturnType<typeof setInterval>;
let retryTimeout: ReturnType<typeof setTimeout>;
let retryAttempt = 0;
let wasConnectedBefore = false;

function setupWebSocket() {
  const ws = new WebSocket(WS_URL!);

  ws.addEventListener("open", async () => {
    console.log(t("logs.wsConnected"));
    retryAttempt = 0; // Reset retry attempt counter on successful connection
    
    if (!wasConnectedBefore) {
      // Initial connection notification
      await sendNtfyToAll(
        ntfyConfigs,
        t("notifications.wsInitialConnection"),
        t("notifications.wsInitialConnectionBody"),
        {
          priority: 1,
          tags: ['rocket', 'system']
        }
      );
    } else {
      // Reconnection notification
      await sendNtfyToAll(
        ntfyConfigs,
        t("notifications.wsReconnected"),
        t("notifications.wsReconnectedBody", { siteName }),
        {
          priority: 1,
          tags: ['white_check_mark', 'system']
        }
      );
    }
    wasConnectedBefore = true;
    
    // Setup ping interval
    clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
        console.log(t("logs.pingSent"));
      }
    }, PING_INTERVAL_MS);
  });

  ws.addEventListener("close", async () => {
    console.warn(t("logs.wsClosed"));
    cleanup();
    
    // Only notify on first disconnection
    if (retryAttempt === 0) {
      await sendNtfyToAll(
        ntfyConfigs,
        t("notifications.wsDisconnected"),
        t("notifications.wsDisconnectedBody", { siteName }),
        {
          priority: 1,
          tags: ['warning', 'system']
        }
      );
    }
    
    scheduleReconnect();
  });

  ws.addEventListener("error", (err) => {
    console.error(t("errors.wsError"), err);
    cleanup();
    scheduleReconnect();
  });

  ws.addEventListener("message", async (ev) => {
    try {
      const msg = JSON.parse(ev.data as string) as WsEvent;
      if (!isMessageOrEdit(msg)) return;

      const { content, topic, id: messageId, user } = msg.data;

      // For each config, check its filters/blacklist and send if matched
      for (const cfg of ntfyConfigs) {
        const { filters, blacklist } = cfg;
        if (
          blacklist.content.some((r) => r.test(content)) ||
          blacklist.author.some((r) => r.test(user.username)) ||
          blacklist.topic.some((r) => r.test(topic.slug))
        ) {
          continue;
        }

        // Determine which filter matched
        const matchedByContent = filters.content.some((r) => r.test(content));
        const matchedByAuthor = filters.author.some((r) => r.test(user.username));
        const matchedByTopic = filters.topic.some((r) => r.test(topic.slug));

        if (!matchedByContent && !matchedByAuthor && !matchedByTopic) continue;

        // Determine primary match category for the second tag
        let category: string;
        let emojiTag: string;
        if (matchedByContent) {
          category = 'content';
          emojiTag = 'speech_balloon';
        } else if (matchedByAuthor) {
          category = 'author';
          emojiTag = 'bust_in_silhouette';
        } else {
          category = 'topic';
          emojiTag = 'bookmark';
        }

        console.log(t("logs.eventDetected", { type: msg.type.toUpperCase() }), {
          config: cfg.name,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          author: user.username,
          topic: topic.slug
        });

        const clickUrl = `${BASE_URL}/village/${topic.id}-${topic.slug}?m=${messageId}`;
        const { title, body } = formatNotificationBody(msg, filters.content);

        try {
          await sendNtfy(
            cfg,
            title,
            body,
            {
              click: clickUrl,
              priority: 3,
              tags: [emojiTag, category]
            }
          );
          console.log(`✅ ntfy pushed to ${cfg.name}`);
        } catch (error) {
          console.error(`❌ ntfy push failed for ${cfg.name}:`, error);
        }
      }
    } catch (err) {
      console.warn(t("errors.failedParseMessage"), err);
    }
  });

  return ws;
}

function cleanup() {
  clearInterval(pingInterval);
  clearTimeout(retryTimeout);
}

function scheduleReconnect() {
  const delay = Math.min(
    INITIAL_RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retryAttempt),
    MAX_RETRY_DELAY_MS
  );
  
  console.log(t("logs.wsRetrying", { attempt: retryAttempt + 1, delay: Math.round(delay / 1000) }));
  
  clearTimeout(retryTimeout);
  retryTimeout = setTimeout(() => {
    retryAttempt++;
    setupWebSocket();
  }, delay);
}

// Start the WebSocket connection
setupWebSocket();
