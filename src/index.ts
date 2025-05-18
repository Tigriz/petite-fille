import { config as loadEnv } from "dotenv";
import { loadConfig } from "./config";
import { isMessageOrEdit, type EditEvent, type MessageEvent, type WsEvent } from "../types/events";
import { formatNotificationBody, type NtfyConfig } from "./utils";
import { sendNtfy } from "./notifications";
import { setLocale, t } from "./i18n";

loadEnv();

const { BASE_URL, WS_URL, NTFY_URL, NTFY_USER, NTFY_PASS, NTFY_TOKEN, LOCALE = "en" } = process.env;
if (!WS_URL || !NTFY_URL) {
  console.error(t("errors.missingEnvVars"));
  process.exit(1);
}

setLocale(LOCALE as "en" | "fr");

const config = loadConfig();
const { filters, blacklist } = config;
const { topic } = config.ntfy;

const ntfyConfig: NtfyConfig = {
  url: NTFY_URL,
  topic,
  ...(NTFY_TOKEN ? { token: NTFY_TOKEN } : 
      NTFY_USER && NTFY_PASS ? { user: NTFY_USER, pass: NTFY_PASS } : {})
};

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
    
    // Notify about reconnection if this isn't the first connection
    if (wasConnectedBefore) {
      await sendNtfy(
        ntfyConfig,
        t("notifications.wsReconnected"),
        t("notifications.wsReconnectedBody"),
        undefined
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
      await sendNtfy(
        ntfyConfig,
        t("notifications.wsDisconnected"),
        t("notifications.wsDisconnectedBody"),
        undefined
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

      if (blacklist.content.some((r) => r.test(content)) ||
          blacklist.author.some((r) => r.test(user.username)) ||
          blacklist.topic.some((r) => r.test(topic.slug))) {
        return;
      }

      const matchesFilter = 
        filters.content.some((r) => r.test(content)) ||
        filters.author.some((r) => r.test(user.username)) ||
        filters.topic.some((r) => r.test(topic.slug));

      if (!matchesFilter) return;

      console.log(t("logs.eventDetected", { type: msg.type.toUpperCase() }), {
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        author: user.username,
        topic: topic.slug
      });

      const clickUrl = `${BASE_URL}/village/${topic.id}-${topic.slug}?m=${messageId}`;
      const { title, body } = formatNotificationBody(msg, filters.content);

      await sendNtfy(
        ntfyConfig,
        title,
        body,
        clickUrl
      );
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
