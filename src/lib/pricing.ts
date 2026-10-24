import type { CountryCode } from "../i18n/config.ts";
import type { Availability, CategoryRecord, PriceRow, PromotionRecord } from "../types/catalog.ts";
import { ancestry } from "./categories.ts";

export const LOW_STOCK_AT = 3;

export function roundMoney(n: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function isPromotionActive(p: PromotionRecord, country: CountryCode, now: Date) {
  if (!p.active) return false;
  if (p.country && p.country !== country) return false;
  if (p.startsAt && new Date(p.startsAt) > now) return false;
  if (p.endsAt && new Date(p.endsAt) < now) return false;
  return true;
}

/**
 * Best (highest) active percentage discount that applies to a product. Discounts never stack.
 * A category-scoped promotion matches the product's stored category/subcategory (so promotions that still use a
 * retired slug keep working while products reference it) AND, when `categories` is given, every ancestor of them —
 * so a promotion on "Mobile Phones" covers its "iPhones" products.
 */
export function promoPercentFor(
  promos: PromotionRecord[],
  product: { id: string; category: string; subcategory?: string | null; brand: string },
  country: CountryCode,
  now: Date,
  categories: CategoryRecord[] = [],
) {
  const inCategory = new Set<string>([product.category]);
  if (product.subcategory) inCategory.add(product.subcategory);
  for (const slug of [product.category, product.subcategory]) for (const c of ancestry(categories, slug)) inCategory.add(c.slug);
  let best = 0;
  for (const p of promos) {
    if (p.discountPercent <= 0 || !isPromotionActive(p, country, now)) continue;
    const hit =
      p.scope === "all" ||
      (p.scope === "category" && p.scopeValue !== null && inCategory.has(p.scopeValue)) ||
      (p.scope === "brand" && p.scopeValue === product.brand) ||
      (p.scope === "product" && p.scopeValue === product.id);
    if (hit) best = Math.max(best, p.discountPercent);
  }
  return Math.min(best, 90);
}

export type ResolvedPrice = { price: number; compareAt: number | null; discountPct: number | null };

/**
 * Final selling price for one country. `row.price` is the regional list price; `row.compareAt` is an
 * optional higher "was" price. A promotion percentage is applied to the list price. Amounts are rounded
 * to the currency's decimals (AED 2, OMR 3). No currency conversion ever happens here.
 */
export function resolvePrice(row: PriceRow, promoPercent: number, decimals: number): ResolvedPrice {
  const list = roundMoney(row.price, decimals);
  let original = row.compareAt !== null && row.compareAt > list ? roundMoney(row.compareAt, decimals) : null;
  let price = list;
  if (promoPercent > 0) {
    price = roundMoney(list * (1 - promoPercent / 100), decimals);
    original = Math.max(original ?? 0, list);
  }
  if (original === null || original <= price) return { price, compareAt: null, discountPct: null };
  return { price, compareAt: original, discountPct: Math.round(((original - price) / original) * 100) };
}

export function availabilityOf(row: PriceRow | undefined): Availability {
  if (!row || !row.available || row.stock <= 0) return "out_of_stock";
  return row.stock <= LOW_STOCK_AT ? "low_stock" : "in_stock";
}

export function formatMoney(amount: number, currency: string, decimals: number, lang: "en" | "ar") {
  const locale = lang === "ar" ? "ar-AE-u-nu-latn" : "en-US";
  const n = amount.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return lang === "ar" ? `${n} ${currency === "AED" ? "د.إ" : currency === "OMR" ? "ر.ع." : currency}` : `${currency} ${n}`;
}
