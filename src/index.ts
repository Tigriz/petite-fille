import { config as loadEnv } from "dotenv";
import { loadConfig } from "./config";
import { isMessageOrEdit, type EditEvent, type MessageEvent, type WsEvent } from "../types/events";
import { formatNotificationBody, type NtfyConfig } from "./utils";
import { sendNtfy } from "./notifications";
import { setLocale, t } from "./locales";

loadEnv();

const { BASE_URL, WS_URL, NTFY_URL, NTFY_USER, NTFY_PASS, NTFY_TOKEN, LOCALE = "en" } = process.env;
if (!WS_URL || !NTFY_URL) {
  console.error(t("errors.missingEnvVars"));
  process.exit(1);
}

setLocale(LOCALE as "en" | "fr");

const { ntfy: { topic }, filters, blacklist } = loadConfig();
console.log(t("logs.loadedFilters", {
  filterCount: Object.values(filters).flat().length,
  blacklistCount: Object.values(blacklist).flat().length,
}));

const ntfyConfig: NtfyConfig = {
  url: NTFY_URL,
  topic,
  ...(NTFY_TOKEN ? { token: NTFY_TOKEN } : 
      NTFY_USER && NTFY_PASS ? { user: NTFY_USER, pass: NTFY_PASS } : {})
};

const ws = new WebSocket(WS_URL);

const PING_INTERVAL_MS = 60_000;
let pingInterval: ReturnType<typeof setInterval>;

ws.addEventListener("open", () => {
  console.log(t("logs.wsConnected"));
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
      console.log(t("logs.pingSent"));
    }
  }, PING_INTERVAL_MS);
});

ws.addEventListener("close", () => {
  console.warn(t("logs.wsClosed"));
  clearInterval(pingInterval);
});

ws.addEventListener("error", (err) => {
  console.error(t("errors.wsError"), err);
  clearInterval(pingInterval);
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
