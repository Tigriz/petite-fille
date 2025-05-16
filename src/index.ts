// src/index.ts
import { config as loadEnv } from "dotenv";
import { loadConfig } from "./config";
import { isMessageOrEdit, type EditEvent, type MessageEvent, type WsEvent } from "../types/events";
loadEnv();

const { BASE_URL, WS_URL, NTFY_URL, NTFY_TOPIC, NTFY_USER, NTFY_PASS, NTFY_TOKEN } = process.env;
if (!WS_URL || !NTFY_URL || !NTFY_TOPIC) {
  console.error("⚠️  Missing one of WS_URL, NTFY_URL or NTFY_TOPIC in .env");
  process.exit(1);
}

const { filters } = loadConfig();
console.log(`🔍 Loaded ${filters.length} filter(s)`);

const ws = new WebSocket(WS_URL);
ws.addEventListener("open", () => console.log("✅ WS open"));
ws.addEventListener("error", (e) => console.error("❌ WS error:", e));
ws.addEventListener("close", (e) => console.log(`🔒 WS closed (code=${e.code})`));

ws.addEventListener("message", async (ev) => {
  try {
    const msg = JSON.parse(ev.data as string) as WsEvent;
    if (!isMessageOrEdit(msg)) return;

    const { content, topic, id: messageId, user } = msg.data;
    if (!filters.some((r) => r.test(content))) return;

    console.log(`🚨 ${msg.type.toUpperCase()} detected:`, content);

    const clickUrl = `${BASE_URL}/village/${topic.id}-${topic.slug}?m=${messageId}`;
    const { title, body } = formatNotificationBody(msg, filters);

    await sendNtfy(title, body, clickUrl);
  } catch (err) {
    console.warn("⚠️  Failed to parse message:", err);
  }
});

async function sendNtfy(title: string, body: string, actionUrl?: string) {
  const url = `${NTFY_URL}/${NTFY_TOPIC}`;
  const headers: Record<string, string> = {
    "Content-Type": "text/plain",
    Title: title,
    Markdown: "yes",
  };

  if (actionUrl) headers["Click"] = actionUrl;

  if (NTFY_TOKEN) headers.Authorization = `Bearer ${NTFY_TOKEN}`;
  else if (NTFY_USER && NTFY_PASS) {
    const creds = Buffer.from(`${NTFY_USER}:${NTFY_PASS}`).toString("base64");
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

/**
 * Extracts a snippet of the content: one line before and after
 * the line that contains your mention (or, if there's no newline,
 * just the full content).
 */
function snippetAroundMention(content: string, mentionPatterns: RegExp[]): string {
  // Split into lines
  const lines = content.split("\n");
  // Find the first line index matching any pattern
  const idx = lines.findIndex((line) => mentionPatterns.some((rx) => rx.test(line)));
  if (idx === -1) {
    // No specific line; return entire content cropped to ~200 chars
    return content.length > 200 ? content.slice(0, 197) + "…" : content;
  }

  const pre = idx > 0 ? lines[idx - 1] : "";
  const match = lines[idx];
  const post = idx < lines.length - 1 ? lines[idx + 1] : "";

  // Join & crop if huge
  const snippet = [pre, match, post].filter(Boolean).join("\n").trim();
  return snippet.length > 300 ? snippet.slice(0, 297) + "…" : snippet;
}

/**
 * Formats the notification body to include:
 * - Topic title (using slug as a placeholder)
 * - Replied message (if any)
 * - Author
 * - Snippet around the mention
 */
function formatNotificationBody(msg: MessageEvent | EditEvent, mentionPatterns: RegExp[]): { title: string; body: string } {
  const { topic, user, content, repliedMessage } = {
    ...msg.data,
    content: msg.data.content,
    repliedMessage: msg.data.repliedMessage,
    user: msg.data.user,
    topic: msg.data.topic,
  };

  // Build body parts
  const parts: string[] = [];

  parts.push(`By ${user.username}`);

  if (repliedMessage) {
    parts.push(`Replying to (${repliedMessage.user.username})`);
    // Crop replied content if too long:
    const replySnippet = repliedMessage.content.length > 100 ? repliedMessage.content.slice(0, 97) + "…" : repliedMessage.content;
    parts.push(`> ${replySnippet}`);
  }

  // Add the snippet around the mention
  parts.push(snippetAroundMention(content, mentionPatterns));

  return {
    title: topic.slug.replace(/-/g, " "),
    body: parts.join("\n\n"),
  };
}
