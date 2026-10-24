import type { Metadata } from "next";
import { defaultLocale, locales, parseLocale, type Locale } from "@/i18n/config";
import { site } from "@/config/site";

const hreflang = (l: Locale) => {
  const { country, lang } = parseLocale(l);
  return `${lang}-${country === "uae" ? "AE" : "OM"}`;
};

/** canonical + hreflang alternates for a path inside the locale (e.g. "/shop"). */
export function alternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[hreflang(l)] = `/${l}${path}`;
  languages["x-default"] = `/${defaultLocale}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}

export function pageMeta(locale: Locale, path: string, title: string, description: string, image?: string): Metadata {
  const { lang } = parseLocale(locale);
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title,
      description,
      url: `/${locale}${path}`,
      siteName: lang === "ar" ? site.nameAr : site.name,
      locale: hreflang(locale).replace("-", "_"),
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}
