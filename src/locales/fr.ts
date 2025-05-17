import type { LocaleStrings } from "./types";

export const fr: LocaleStrings = {
  errors: {
    missingEnvVars: "⚠️  Il manque WS_URL ou NTFY_URL dans le fichier .env",
    failedParseMessage: "⚠️  Impossible de parser le message :",
    ntfyPushFailed: "❌ Échec de l'envoi ntfy",
    wsError: "🚨 Erreur WebSocket :",
  },
  logs: {
    loadedFilters: "🔍 Chargement de {filterCount} filtre(s) et {blacklistCount} règle(s) de blacklist",
    wsConnected: "✅ Connexion WebSocket établie.",
    wsClosed: "❌ Connexion WebSocket fermée.",
    pingSent: "📡 Ping envoyé pour maintenir la connexion.",
    eventDetected: "🚨 {type} détecté :",
    ntfyPushed: "✅ ntfy envoyé",
  },
  notifications: {
    by: "Par {username}",
    replyingTo: "En réponse à ({username})",
  },
}; 