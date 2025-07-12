import { readFileSync } from "fs";
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

export function loadConfig(): AppConfig {
  const raw = readFileSync(join(__dirname, "../config.json"), "utf-8");
  const json = JSON.parse(raw) as RawNtfyInstanceConfig[];

  return json.map(cfg => ({
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
}
