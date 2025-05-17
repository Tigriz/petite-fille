import { en } from "./en";
import { fr } from "./fr";
import type { LocaleStrings } from "./types";

export type SupportedLocale = "en" | "fr";

const locales: Record<SupportedLocale, LocaleStrings> = {
  en,
  fr,
};

let currentLocale: SupportedLocale = "en";

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
}

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in keyof T]: [K, ...PathsToStringProps<T[K]>];
    }[keyof T];

type Join<T extends any[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? string
    : never
  : string;

type LocalePaths = Join<PathsToStringProps<LocaleStrings>, ".">;

export function t(path: LocalePaths, params: Record<string, string | number> = {}): string {
  const keys = path.split(".");
  let value: any = locales[currentLocale];

  for (const key of keys) {
    value = value[key];
  }

  if (typeof value !== "string") {
    throw new Error(`Translation not found for path: ${path}`);
  }

  return value.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? `{${key}}`));
} 