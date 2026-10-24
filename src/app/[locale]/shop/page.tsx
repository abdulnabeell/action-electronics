import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ShopClient from "@/components/ShopClient";
import { isLocale, parseLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getStorefront } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { locales as allLocales } from "@/i18n/config";

export const dynamic = "force-static";
export function generateStaticParams() {
  return allLocales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(parseLocale(locale).lang);
  return pageMeta(locale, "/shop", dict.shop.title, dict.seo.shopDescription);
}

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(parseLocale(locale).lang);
  const sf = await getStorefront(locale);
  return (
    <Suspense fallback={<div className="container-x py-10 text-slate-500">{dict.common.loading}</div>}>
      <ShopClient products={sf.products} categories={sf.categories} brands={sf.brands} title={dict.shop.title} />
    </Suspense>
  );
}
