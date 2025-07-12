import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

interface NtfyConfig {
  name: string;
  url: string;
  topic: string;
  auth: {
    type: "none" | "token" | "basic";
    token?: string;
    user?: string;
    pass?: string;
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

function setupConfig() {
  const configPath = join(process.cwd(), "config.json");
  let configs: NtfyConfig[];

  try {
    const existingConfig = JSON.parse(readFileSync(configPath, "utf-8"));
    
    // Handle legacy format (single topic)
    if (existingConfig.ntfy?.topic && !Array.isArray(existingConfig)) {
      configs = [{
        name: "default",
        url: "https://ntfy.sh",
        topic: existingConfig.ntfy.topic,
        auth: { type: "none" },
        filters: existingConfig.filters || { content: [], author: [], topic: [] },
        blacklist: existingConfig.blacklist || { content: [], author: [], topic: [] }
      }];
    } else if (Array.isArray(existingConfig)) {
      // New format (array of configs)
      configs = existingConfig;
    } else {
      // No config found, create default
      configs = [{
        name: "default",
        url: "https://ntfy.sh",
        topic: generateRandomTopic(),
        auth: { type: "none" },
        filters: { content: [], author: [], topic: [] },
        blacklist: { content: [], author: [], topic: [] }
      }];
    }
  } catch {
    // No config file exists, create default
    configs = [{
      name: "default",
      url: "https://ntfy.sh",
      topic: generateRandomTopic(),
      auth: { type: "none" },
      filters: { content: [], author: [], topic: [] },
      blacklist: { content: [], author: [], topic: [] }
    }];
  }

  writeFileSync(configPath, JSON.stringify(configs, null, 2));
  console.log("✅ Config file setup complete");
  
  configs.forEach(cfg => {
    console.log(`📢 Config: ${cfg.name}`);
    console.log(`🔗 NTFY URL: ${cfg.url}/${cfg.topic}`);
    console.log(`🔐 Auth: ${cfg.auth.type}`);
    console.log("");
  });
}

setupConfig(); 