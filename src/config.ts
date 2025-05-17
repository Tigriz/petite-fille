import { readFileSync } from "fs";
import { join } from "path";

interface FilterRules {
  content: RegExp[];
  author: RegExp[];
  topic: RegExp[];
}

export interface AppConfig {
  ntfy: {
    topic: string;
  };
  filters: FilterRules;
  blacklist: FilterRules;
}

interface RawConfig {
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

function convertToRegExp(patterns: string[]): RegExp[] {
  return patterns.map(pat => new RegExp(pat, "i"));
}

export function loadConfig(): AppConfig {
  const raw = readFileSync(join(__dirname, "../config.json"), "utf-8");
  const json = JSON.parse(raw) as RawConfig;
  
  return {
    ntfy: {
      topic: json.ntfy.topic
    },
    filters: {
      content: convertToRegExp(json.filters.content),
      author: convertToRegExp(json.filters.author),
      topic: convertToRegExp(json.filters.topic)
    },
    blacklist: {
      content: convertToRegExp(json.blacklist.content),
      author: convertToRegExp(json.blacklist.author),
      topic: convertToRegExp(json.blacklist.topic)
    }
  };
}
