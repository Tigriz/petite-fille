import { type EditEvent, type MessageEvent } from "../types/events";
import { t } from "./i18n";
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { type NtfyInstanceConfig } from "./config";

// Initialize NodeHtmlMarkdown with custom options
const nhm = new NodeHtmlMarkdown(
  /* options */ {
    preferNativeParser: false,
    keepDataImages: false,
    codeFence: '```',
    bulletMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**'
  }
);

function convertHtmlToMarkdown(html: string): string {
  if (!html.trim()) return '';
  
  try {
    // Convert HTML to Markdown using node-html-markdown
    let markdown = nhm.translate(html);
    
    // Post-processing cleanup
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/^\s+|\s+$/g, ''); // Trim whitespace
    
    return markdown;
  } catch (error) {
    console.warn('Error converting HTML to Markdown:', error);
    // Fallback to the original HTML if conversion fails
    return html;
  }
}

export const DEBOUNCE_DELAY = 10_000;
export type PendingNotification = {
  title: string;
  body: string;
  actionUrl?: string;
  timestamp: number;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  config: NtfyInstanceConfig;
};

export type NotificationGroup = {
  title: string;
  bodies: string[];
  actionUrl?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  config: NtfyInstanceConfig;
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
        tags: notif.tags,
        config: notif.config
      });
    }
    groups.get(key)!.bodies.push(notif.body);
  }

  return Array.from(groups.values());
}

export function formatNotificationBody(msg: MessageEvent | EditEvent, mentionPatterns: RegExp[]): { title: string; body: string } {
  const { topic, user, content, repliedMessage } = {
    ...msg.data,
    content: convertHtmlToMarkdown(msg.data.content),
    repliedMessage: msg.data.repliedMessage ? {
      ...msg.data.repliedMessage,
      content: convertHtmlToMarkdown(msg.data.repliedMessage.content)
    } : null,
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

  // Add the full content, truncated if too long
  const truncatedContent = content.length > 300 ? content.slice(0, 297) + "…" : content;
  parts.push(truncatedContent);

  return {
    title: topic.slug.replace(/-/g, " "),
    body: parts.join("\n\n"),
  };
} 