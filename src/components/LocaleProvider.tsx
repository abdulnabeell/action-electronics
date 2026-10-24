"use client";

import { createContext, useContext, useMemo } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { dirOf, localePath, makeLocale, parseLocale, type CountryCode, type Lang, type Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/pricing";
import type { CountryRecord } from "@/types/catalog";

export type CountryInfo = Pick<
  CountryRecord,
  "code" | "currency" | "currencyDecimals" | "whatsappNumber" | "phone" | "phoneDisplay" | "email" | "freeDeliveryOver" | "deliveryFee" | "timeZone" | "openDays" | "openHour" | "closeHour"
> & { name: string; regions: { value: string; label: string }[]; deliveryInfo: string; address: string };

type Ctx = {
  locale: Locale;
  country: CountryCode;
  lang: Lang;
  dir: "ltr" | "rtl";
  dict: Dictionary;
  info: CountryInfo;
  /** Format an amount in the current country's currency. */
  money: (n: number) => string;
  /** Prefix a path with the current locale: href("/shop") -> "/uae-en/shop". */
  href: (path?: string) => string;
  /** Same page in another country/language. */
  localeFor: (c: CountryCode, l: Lang) => Locale;
};

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({
  locale,
  dict,
  info,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  info: CountryInfo;
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    const { country, lang } = parseLocale(locale);
    return {
      locale,
      country,
      lang,
      dir: dirOf(lang),
      dict,
      info,
      money: (n) => formatMoney(n, info.currency, info.currencyDecimals, lang),
      href: (path = "") => localePath(locale, path),
      localeFor: makeLocale,
    };
  }, [locale, dict, info]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error("useLocale must be used inside LocaleProvider");
  return c;
}
