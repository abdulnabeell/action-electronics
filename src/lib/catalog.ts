import "server-only";
import { cache } from "react";
import { defaultCountries } from "@/config/countries";
import { seedBrands, seedCategories, seedProducts, seedPromotions } from "@/data/seed";
import { countryCodes, parseLocale, type CountryCode, type Lang, type Locale } from "@/i18n/config";
import { availabilityOf, promoPercentFor, resolvePrice } from "@/lib/pricing";
import { buildTree, productPath, type CategoryNode } from "@/lib/categories";
import { CatalogUnavailableError, demoDataEnabled, withoutDemo } from "@/lib/demo-mode";
import { fetchAllPages } from "@/lib/paginate";
import { hasPublicDb, publicClient } from "@/lib/supabase/server";
import type {
  BrandRecord,
  CategoryRecord,
  CountryRecord,
  L10n,
  PriceRow,
  ProductRecord,
  ProductView,
  PromotionRecord,
} from "@/types/catalog";

// ------------------------------------------------------------------ raw data (DB; the demo seed only when ALLOW_DEMO_DATA=true)

type Raw = {
  countries: Record<CountryCode, CountryRecord>;
  categories: CategoryRecord[];
  brands: BrandRecord[];
  products: ProductRecord[];
  promotions: PromotionRecord[];
  source: "database" | "demo";
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const l10n = (en: unknown, ar: unknown): L10n => ({ en: String(en ?? ""), ar: String(ar ?? "") });
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function mapCountry(r: any): CountryRecord {
  return {
    code: r.code,
    name: l10n(r.name_en, r.name_ar),
    currency: r.currency,
    currencyDecimals: r.currency_decimals,
    whatsappNumber: r.whatsapp_number ?? "",
    phone: r.phone ?? "",
    phoneDisplay: r.phone_display ?? "",
    email: r.email ?? "",
    address: l10n(r.address_en, r.address_ar),
    mapsLink: r.maps_link ?? "",
    mapsEmbed: r.maps_embed ?? "",
    deliveryInfo: l10n(r.delivery_info_en, r.delivery_info_ar),
    deliveryFee: Number(r.delivery_fee ?? 0),
    freeDeliveryOver: num(r.free_delivery_over),
    regions: (r.regions ?? []) as L10n[],
    hours: (r.hours ?? []) as CountryRecord["hours"],
    openDays: r.open_days ?? [],
    openHour: r.open_hour ?? 0,
    closeHour: r.close_hour ?? 0,
    timeZone: r.time_zone ?? "Asia/Dubai",
    enabled: !!r.enabled,
  };
}

function mapProduct(r: any): ProductRecord {
  const prices: ProductRecord["prices"] = {};
  for (const p of r.product_prices ?? []) {
    prices[p.country_code as CountryCode] = {
      price: Number(p.price),
      compareAt: num(p.compare_at),
      stock: p.stock,
      available: !!p.available,
    };
  }
  return {
    id: r.id,
    slug: r.id,
    sku: r.sku,
    name: l10n(r.name_en, r.name_ar),
    brand: r.brand_slug,
    category: r.category_slug,
    subcategory: r.subcategory_slug ?? null,
    condition: r.condition,
    grade: r.grade ?? null,
    description: l10n(r.description_en, r.description_ar),
    specs: { en: r.specs_en ?? [], ar: r.specs_ar ?? [] },
    images: r.images ?? [],
    warranty: l10n(r.warranty_en, r.warranty_ar),
    featured: !!r.featured,
    active: !!r.active,
    isDemo: !!r.is_demo,
    createdAt: r.created_at,
    prices,
  };
}

function mapPromotion(r: any): PromotionRecord {
  return {
    id: r.id,
    title: l10n(r.title_en, r.title_ar),
    subtitle: l10n(r.subtitle_en, r.subtitle_ar),
    imageUrl: r.image_url ?? null,
    linkPath: r.link_path ?? null,
    discountPercent: Number(r.discount_percent ?? 0),
    scope: r.scope,
    scopeValue: r.scope_value ?? null,
    country: (r.country_code as CountryCode | null) ?? null,
    startsAt: r.starts_at ?? null,
    endsAt: r.ends_at ?? null,
    active: !!r.active,
    sort: r.sort ?? 0,
  };
}

export const mappers = { mapCountry, mapProduct, mapPromotion };

export const loadRaw = cache(async (): Promise<Raw> => {
  if (!hasPublicDb()) {
    // Fake products are only ever served when ALLOW_DEMO_DATA=true is set on purpose (local development).
    if (!demoDataEnabled()) throw new CatalogUnavailableError("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
    return {
      countries: defaultCountries,
      categories: seedCategories,
      brands: seedBrands,
      products: seedProducts,
      promotions: seedPromotions,
      source: "demo",
    };
  }
  const db = publicClient();
  const [c, cat, b, products, pr] = await Promise.all([
    db.from("countries").select("*"),
    db.from("categories").select("*").order("sort"),
    db.from("brands").select("*").order("name"),
    // Paged: the API returns at most 1000 rows per request. Ordered by id so pages never overlap.
    fetchAllPages<any>((from, to) => db.from("products").select("*, product_prices(*)").order("id").range(from, to)),
    db.from("promotions").select("*").order("sort"),
  ]);
  for (const res of [c, cat, b, pr]) if (res.error) throw new Error(`Catalogue query failed: ${res.error.message}`);
  const p = { data: products };

  const countries = { ...defaultCountries };
  for (const row of c.data ?? []) countries[row.code as CountryCode] = mapCountry(row);
  const real = demoDataEnabled()
    ? null
    : withoutDemo({ products: (p.data ?? []).map(mapProduct), brands: (b.data ?? []).map((r: any) => ({ slug: r.slug, name: r.name, isDemo: !!r.is_demo })), promotions: (pr.data ?? []).map(mapPromotion) });
  return {
    countries,
    categories: (cat.data ?? []).map((r: any) => ({ slug: r.slug, name: l10n(r.name_en, r.name_ar), parent: r.parent_slug, sort: r.sort, active: r.active !== false, image: r.image_url ?? null })),
    brands: real?.brands ?? (b.data ?? []).map((r: any) => ({ slug: r.slug, name: r.name, isDemo: !!r.is_demo })),
    products: real?.products ?? (p.data ?? []).map(mapProduct),
    promotions: real?.promotions ?? (pr.data ?? []).map(mapPromotion),
    source: "database",
  };
});

// ------------------------------------------------------------------ localized views

export const pick = (v: L10n, lang: Lang) => (lang === "ar" && v.ar ? v.ar : v.en);

export type CategoryView = { slug: string; name: string; imageUrl: string | null; children: CategoryView[] };
export type PromoView = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  linkPath: string | null;
  discountPercent: number;
};

export type Storefront = {
  country: CountryRecord;
  source: Raw["source"];
  categories: CategoryView[];
  brands: { slug: string; name: string }[];
  promotions: PromoView[];
  products: ProductView[];
  hasDemo: boolean;
};

function toView(r: ProductRecord, raw: Raw, country: CountryRecord, lang: Lang, now: Date): ProductView {
  const row: PriceRow | undefined = r.prices[country.code];
  const brand = raw.brands.find((b) => b.slug === r.brand);
  const path = productPath(raw.categories, r.category, r.subcategory);
  const cat = path[0] ?? raw.categories.find((c) => c.slug === r.category);
  const sub = path.length > 1 ? path[path.length - 1] : undefined;
  const sellable = !!row && row.available;
  const pct = sellable ? promoPercentFor(raw.promotions, r, country.code, now, raw.categories) : 0;
  const price = row ? resolvePrice(row, pct, country.currencyDecimals) : { price: 0, compareAt: null, discountPct: null };
  return {
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: pick(r.name, lang),
    brand: { slug: r.brand, name: brand?.name ?? r.brand },
    category: { slug: cat?.slug ?? r.category, name: cat ? pick(cat.name, lang) : r.category },
    subcategory: sub ? { slug: sub.slug, name: pick(sub.name, lang) } : null,
    categoryPath: path.map((c) => ({ slug: c.slug, name: pick(c.name, lang) })),
    condition: r.condition,
    grade: r.grade,
    description: pick(r.description, lang),
    specs: lang === "ar" && r.specs.ar.length ? r.specs.ar : r.specs.en,
    images: r.images,
    warranty: pick(r.warranty, lang),
    featured: r.featured,
    isDemo: r.isDemo,
    price: price.price,
    compareAt: price.compareAt,
    discountPct: price.discountPct,
    stock: sellable ? row!.stock : 0,
    availability: !row || !row.available ? "unavailable" : availabilityOf(row),
    createdAt: r.createdAt,
  };
}

export const getCountry = cache(async (code: CountryCode): Promise<CountryRecord> => (await loadRaw()).countries[code]);

export const getEnabledCountries = cache(async () => {
  const raw = await loadRaw();
  return countryCodes.map((c) => raw.countries[c]).filter((c) => c.enabled);
});

export const getStorefront = cache(async (locale: Locale): Promise<Storefront> => {
  const { country: code, lang } = parseLocale(locale);
  const raw = await loadRaw();
  const country = raw.countries[code];
  const now = new Date();
  const catView = (n: CategoryNode): CategoryView => ({ slug: n.slug, name: pick(n.name, lang), imageUrl: n.image, children: n.children.map(catView) });
  const products = raw.products
    .filter((p) => p.active && p.prices[code]?.available)
    .map((p) => toView(p, raw, country, lang, now));
  const usedBrands = new Set(products.map((p) => p.brand.slug));
  return {
    country,
    source: raw.source,
    categories: buildTree(raw.categories).map(catView),
    brands: raw.brands.filter((b) => usedBrands.has(b.slug)).map((b) => ({ slug: b.slug, name: b.name })),
    promotions: raw.promotions
      .filter((p) => p.active && (!p.country || p.country === code))
      .filter((p) => (!p.startsAt || new Date(p.startsAt) <= now) && (!p.endsAt || new Date(p.endsAt) >= now))
      .sort((a, b) => a.sort - b.sort)
      .map((p) => ({ id: p.id, title: pick(p.title, lang), subtitle: pick(p.subtitle, lang), imageUrl: p.imageUrl, linkPath: p.linkPath, discountPercent: p.discountPercent })),
    products,
    hasDemo: products.some((p) => p.isDemo),
  };
});

/** One product for a locale — also returned when it isn't sold in the country (availability "unavailable"). */
export async function getProductView(locale: Locale, slug: string): Promise<ProductView | null> {
  const { country: code, lang } = parseLocale(locale);
  const raw = await loadRaw();
  const rec = raw.products.find((p) => p.slug === slug && p.active);
  return rec ? toView(rec, raw, raw.countries[code], lang, new Date()) : null;
}

export async function getAllProductSlugs() {
  const raw = await loadRaw();
  return raw.products.filter((p) => p.active).map((p) => ({ slug: p.slug, countries: countryCodes.filter((c) => p.prices[c]?.available), createdAt: p.createdAt }));
}

export async function getCategoryTree(lang: Lang) {
  const raw = await loadRaw();
  // Only categories reachable from the top through active ones (a retired parent hides its children too).
  const visible = new Set<string>();
  const collect = (nodes: CategoryNode[]) => nodes.forEach((n) => (visible.add(n.slug), collect(n.children)));
  collect(buildTree(raw.categories));
  return raw.categories.filter((c) => visible.has(c.slug)).map((c) => ({ slug: c.slug, name: pick(c.name, lang), parent: c.parent }));
}
