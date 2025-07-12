import { readFileSync, watch, existsSync } from "fs";
import { join } from "path";

export interface FilterRules {
  content: RegExp[];
  author: RegExp[];
  topic: RegExp[];
}

export interface RawFilterRules {
  content: string[];
  author: string[];
  topic: string[];
}

export interface NtfyAuthConfig {
  type: "none" | "token" | "basic";
  token?: string;
  user?: string;
  pass?: string;
}

export interface NtfyInstanceConfig {
  name: string;
  url: string;
  topic: string;
  auth: NtfyAuthConfig;
  filters: FilterRules;
  blacklist: FilterRules;
}

export interface RawNtfyInstanceConfig {
  name: string;
  url: string;
  topic: string;
  auth: NtfyAuthConfig;
  filters: RawFilterRules;
  blacklist: RawFilterRules;
}

export type AppConfig = NtfyInstanceConfig[];

let currentConfig: AppConfig = [];
let configChangeCallbacks: ((config: AppConfig) => void)[] = [];
let configReloadCallbacks: ((config: AppConfig) => void)[] = [];

export function loadConfig(): AppConfig {
  const configPath = join(__dirname, "../config.json");
  
  if (!existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    return currentConfig;
  }
  
  const raw = readFileSync(configPath, "utf-8");
  const json = JSON.parse(raw) as RawNtfyInstanceConfig[];

  const newConfig = json.map(cfg => ({
    ...cfg,
    filters: {
      content: cfg.filters.content.map(pat => new RegExp(pat, "i")),
      author: cfg.filters.author.map(pat => new RegExp(pat, "i")),
      topic: cfg.filters.topic.map(pat => new RegExp(pat, "i")),
    },
    blacklist: {
      content: cfg.blacklist.content.map(pat => new RegExp(pat, "i")),
      author: cfg.blacklist.author.map(pat => new RegExp(pat, "i")),
      topic: cfg.blacklist.topic.map(pat => new RegExp(pat, "i")),
    }
  }));

  currentConfig = newConfig;
  return newConfig;
}

export function getCurrentConfig(): AppConfig {
  return currentConfig;
}

export function onConfigChange(callback: (config: AppConfig) => void) {
  configChangeCallbacks.push(callback);
}

export function onConfigReload(callback: (config: AppConfig) => void) {
  configReloadCallbacks.push(callback);
}

function reloadConfig() {
  console.log('📝 Config file changed, reloading...');
  
  try {
    const newConfig = loadConfig();
    console.log(`📡 Reloaded ${newConfig.length} ntfy configuration(s):`);
    newConfig.forEach(cfg => {
      console.log(`  - ${cfg.name}: ${cfg.url}/${cfg.topic} (${cfg.auth.type} auth)`);
    });
    
    // Notify config reload callbacks (for system notifications)
    configReloadCallbacks.forEach(callback => {
      try {
        callback(newConfig);
      } catch (error) {
        console.error('Error in config reload callback:', error);
      }
    });
    
    // Notify config change callbacks (for main app updates)
    configChangeCallbacks.forEach(callback => {
      try {
        callback(newConfig);
      } catch (error) {
        console.error('Error in config change callback:', error);
      }
    });
    
    console.log('✅ Config reloaded successfully');
  } catch (error) {
    console.error('❌ Failed to reload config:', error);
  }
}

export function startConfigWatcher() {
  const configPath = join(__dirname, "../config.json");
  
  console.log(`🔍 Watching for config changes: ${configPath}`);
  console.log(`📁 Current working directory: ${process.cwd()}`);
  console.log(`📁 Config file exists: ${existsSync(configPath)}`);
  
  // Try native file watching
  try {
    const watcher = watch(configPath, (eventType, filename) => {
      console.log(`🔔 File watch event: ${eventType} - ${filename}`);
      if (eventType === 'change' && filename === 'config.json') {
        reloadConfig();
      }
    });
    
    console.log('✅ File watching enabled');
    
  } catch (error) {
    console.error('❌ File watching failed:', (error as Error).message);
    console.error('Hot reload will not be available');
  }
}
