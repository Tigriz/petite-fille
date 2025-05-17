import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { config as loadEnv } from "dotenv";

loadEnv();

interface Config {
  ntfy: {
    topic: string;
  };
  filters: {
    content: string[];
    author: string[];
    topic: string[];
  };
  blacklist: {
    content: string[];
    author: string[];
    topic: string[];
  };
}

function generateRandomTopic(): string {
  return `petite-fille-${randomBytes(8).toString('hex')}`;
}

function formatNtfyUrl(topic: string): string {
  const ntfyUrl = process.env.NTFY_URL?.replace(/\/$/, '') || 'https://ntfy.sh';
  return `${ntfyUrl}/${topic}`;
}

function setupConfig() {
  const configPath = join(process.cwd(), "config.json");
  let config: Config;

  try {
    const existingConfig = JSON.parse(readFileSync(configPath, "utf-8"));
    config = {
      ntfy: {
        topic: existingConfig.ntfy?.topic || generateRandomTopic()
      },
      filters: existingConfig.filters || { content: [], author: [], topic: [] },
      blacklist: existingConfig.blacklist || { content: [], author: [], topic: [] }
    };
  } catch {
    config = {
      ntfy: {
        topic: generateRandomTopic()
      },
      filters: { content: [], author: [], topic: [] },
      blacklist: { content: [], author: [], topic: [] }
    };
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅ Config file setup complete");
  console.log(`📢 NTFY Topic: ${config.ntfy.topic}`);
  console.log(`🔗 NTFY URL: ${formatNtfyUrl(config.ntfy.topic)}`);
}

setupConfig(); 