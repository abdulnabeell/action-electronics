import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ShopClient from "@/components/ShopClient";
import { isLocale, locales, parseLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategoryTree, getStorefront } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-static";
export async function generateStaticParams() {
  const tree = await getCategoryTree("en");
  return locales.flatMap((locale) => tree.map((c) => ({ locale, slug: c.slug })));
}

// New categories added in Admin are rendered on demand and then cached.
export const dynamicParams = true;

async function resolve(locale: string, slug: string) {
  if (!isLocale(locale)) return null;
  const { lang } = parseLocale(locale);
  const tree = await getCategoryTree(lang);
  const cat = tree.find((c) => c.slug === slug);
  if (!cat) return null;
  // Chain from the top-level category down to this one (max three levels).
  const chain = [cat];
  while (chain[0].parent && chain.length < 4) {
    const up = tree.find((c) => c.slug === chain[0].parent);
    if (!up) break;
    chain.unshift(up);
  }
  return { locale, lang, cat, chain };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = await resolve(locale, slug);
  if (!r) return {};
  return pageMeta(r.locale, `/category/${slug}`, r.cat.name, getDictionary(r.lang).seo.shopDescription);
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  const r = await resolve(locale, slug);
  if (!r) notFound();
  const dict = getDictionary(r.lang);
  const sf = await getStorefront(r.locale);
  const [top, sub, leaf] = r.chain.map((c) => c.slug);
  const initial = { category: top, ...(sub ? { sub } : {}), ...(leaf ? { leaf } : {}) };
  return (
    <Suspense fallback={<div className="container-x py-10 text-slate-500">{dict.common.loading}</div>}>
      <ShopClient products={sf.products} categories={sf.categories} brands={sf.brands} title={r.cat.name} initial={initial} />
    </Suspense>
  );
}
