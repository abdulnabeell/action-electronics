import type { Metadata } from "next";
import CartClient from "@/components/CartClient";
import { isLocale, parseLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { locales as allLocales } from "@/i18n/config";

export const dynamic = "force-static";
export function generateStaticParams() {
  return allLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(parseLocale(locale).lang).cart.title, robots: { index: false } };
}

export default function CartPage() {
  return <CartClient />;
}
