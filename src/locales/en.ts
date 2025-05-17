import type { LocaleStrings } from "./types";

export const en: LocaleStrings = {
  errors: {
    missingEnvVars: "⚠️  Missing one of WS_URL or NTFY_URL in .env",
    missingNtfyAuth: "⚠️  Missing either NTFY_TOKEN or both NTFY_USER and NTFY_PASS in .env",
    failedParseMessage: "⚠️  Failed to parse message:",
    ntfyPushFailed: "❌ ntfy push failed",
    wsError: "🚨 WebSocket error:",
  },
  logs: {
    loadedFilters: "🔍 Loaded {filterCount} filter(s) and {blacklistCount} blacklist rule(s)",
    wsConnected: "✅ WebSocket connection established.",
    wsClosed: "❌ WebSocket connection closed.",
    pingSent: "📡 Ping sent to keep connection alive.",
    eventDetected: "🚨 {type} detected:",
    ntfyPushed: "✅ ntfy pushed",
  },
  notifications: {
    by: "By {username}",
    replyingTo: "Replying to ({username})",
  },
}; 