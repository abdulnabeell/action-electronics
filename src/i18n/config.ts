// Pure locale helpers — no framework imports so they can be unit-tested with plain Node.
// A "locale" in a URL is `<country>-<language>`, e.g. /uae-en/shop or /oman-ar/cart.

export const countryCodes = ["uae", "oman"] as const;
export type CountryCode = (typeof countryCodes)[number];

export const languages = ["en", "ar"] as const;
export type Lang = (typeof languages)[number];

export const locales = countryCodes.flatMap((c) => languages.map((l) => `${c}-${l}` as const));
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uae-en";
export const LOCALE_COOKIE = "ae_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function parseLocale(locale: Locale): { country: CountryCode; lang: Lang } {
  const [country, lang] = locale.split("-") as [CountryCode, Lang];
  return { country, lang };
}

export function makeLocale(country: CountryCode, lang: Lang): Locale {
  return `${country}-${lang}`;
}

export function dirOf(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

/** Build a localized path. `path` must start with "/" (or be empty for the home page). */
export function localePath(locale: Locale, path = "") {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}`;
}

/** Replace the locale segment of a pathname, keeping the rest of the path. */
export function swapLocale(pathname: string, next: Locale) {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = next;
  else parts.splice(1, 0, next);
  return parts.join("/") || `/${next}`;
}

/** Pick the best locale for a first visit: saved cookie, then Accept-Language, then default. */
export function negotiateLocale(cookie: string | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookie)) return cookie;
  const wantsArabic = /^\s*ar/i.test(acceptLanguage ?? "");
  return makeLocale("uae", wantsArabic ? "ar" : "en");
}
