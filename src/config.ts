import { readFileSync } from "fs";
import { join } from "path";

export interface AppConfig {
  filters: RegExp[];
}

export function loadConfig(): AppConfig {
  const raw = readFileSync(join(__dirname, "../config.json"), "utf-8");
  const json = JSON.parse(raw) as { filters: string[] };
  return {
    filters: json.filters.map((pat) => new RegExp(pat, "i"))
  };
}
