import { type EditEvent, type MessageEvent } from "../types/events";
import { t } from "./i18n";

export type NtfyBaseConfig = {
  url: string;
  topic: string;
};

export type NtfyTokenAuth = NtfyBaseConfig & {
  token: string;
  user?: never;
  pass?: never;
};

export type NtfyBasicAuth = NtfyBaseConfig & {
  token?: never;
  user: string;
  pass: string;
};

export type NtfyNoAuth = NtfyBaseConfig & {
  token?: never;
  user?: never;
  pass?: never;
};

export type NtfyConfig = NtfyTokenAuth | NtfyBasicAuth | NtfyNoAuth;

export const DEBOUNCE_DELAY = 10_000;
export type PendingNotification = {
  title: string;
  body: string;
  actionUrl?: string;
  timestamp: number;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
};

export type NotificationGroup = {
  title: string;
  bodies: string[];
  actionUrl?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
};

export function groupSimilarNotifications(notifications: PendingNotification[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();

  for (const notif of notifications) {
    const key = notif.title;
    if (!groups.has(key)) {
      groups.set(key, {
        title: notif.title,
        bodies: [],
        actionUrl: notif.actionUrl,
        priority: notif.priority,
        tags: notif.tags
      });
    }
    groups.get(key)!.bodies.push(notif.body);
  }

  return Array.from(groups.values());
}

export function snippetAroundMention(content: string, mentionPatterns: RegExp[]): string {
  const lines = content.split("\n");
  const idx = lines.findIndex((line) => mentionPatterns.some((rx) => rx.test(line)));
  if (idx === -1) {
    return content.length > 200 ? content.slice(0, 197) + "…" : content;
  }

  const pre = idx > 0 ? lines[idx - 1] : "";
  const match = lines[idx];
  const post = idx < lines.length - 1 ? lines[idx + 1] : "";

  const snippet = [pre, match, post].filter(Boolean).join("\n").trim();
  return snippet.length > 300 ? snippet.slice(0, 297) + "…" : snippet;
}

export function formatNotificationBody(msg: MessageEvent | EditEvent, mentionPatterns: RegExp[]): { title: string; body: string } {
  const { topic, user, content, repliedMessage } = {
    ...msg.data,
    content: msg.data.content,
    repliedMessage: msg.data.repliedMessage,
    user: msg.data.user,
    topic: msg.data.topic,
  };

  const parts: string[] = [];

  parts.push(t("notifications.by", { username: user.username }));

  if (repliedMessage) {
    parts.push(t("notifications.replyingTo", { username: repliedMessage.user.username }));
    const replySnippet = repliedMessage.content.length > 100 ? repliedMessage.content.slice(0, 97) + "…" : repliedMessage.content;
    parts.push(`> ${replySnippet}`);
  }

  parts.push(snippetAroundMention(content, mentionPatterns));

  return {
    title: topic.slug.replace(/-/g, " "),
    body: parts.join("\n\n"),
  };
} 