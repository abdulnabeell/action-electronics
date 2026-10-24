import type { Lang } from "../config.ts";
import { ar } from "./ar.ts";
import { en, type Dictionary } from "./en.ts";

export type { Dictionary };

export function getDictionary(lang: Lang): Dictionary {
  return lang === "ar" ? ar : en;
}

/** Replace {placeholders} in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
