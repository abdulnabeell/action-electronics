import "server-only";
import { headers } from "next/headers";
import { defaultLocale, isLocale, parseLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Locale of the current request (the proxy forwards it as x-locale). Used by not-found pages. */
export async function getLocaleFromHeaders() {
  const h = await headers();
  const fromHeader = h.get("x-locale");
  const locale: Locale = isLocale(fromHeader) ? fromHeader : defaultLocale;
  return { locale, dict: getDictionary(parseLocale(locale).lang) };
}
