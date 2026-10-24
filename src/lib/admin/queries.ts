import "server-only";
import { defaultCountries } from "@/config/countries";
import { countryCodes } from "@/i18n/config";
import { mappers } from "@/lib/catalog";
import { ancestry } from "@/lib/categories";
import { fetchAllPages } from "@/lib/paginate";
import { adminClient } from "@/lib/supabase/server";
import type { BrandRecord, CategoryRecord, CountryRecord, OrderStatus, ProductRecord, PromotionRecord } from "@/types/catalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
const unwrap = <T>(res: { data: T | null; error: { message: string } | null }, what: string): T => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
};

export const PAGE_SIZE = 25;

export async function getDashboard() {
  const db = adminClient();
  const [stats, sellers, recent, lowStock, productCount, activeProducts, activePromotions] = await Promise.all([
    db.from("admin_order_stats").select("*"),
    db.from("admin_best_sellers").select("*").order("units", { ascending: false }).limit(10),
    db.from("orders").select("id, order_code, customer_name, total, currency, status, created_at").order("created_at", { ascending: false }).limit(8),
    db.from("product_prices").select("product_id, country_code, stock, products!inner(name_en, active)").eq("available", true).lte("stock", 3).order("stock").limit(10),
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    db.from("promotions").select("id", { count: "exact", head: true }).eq("active", true),
  ]);
  const rows = unwrap(stats, "stats") as { country_code: string; currency: string; status: OrderStatus; orders: number; total: number }[];

  // Sales = confirmed/processing/shipped/completed orders (not pending or cancelled), per currency.
  const counted: OrderStatus[] = ["confirmed", "processing", "shipped", "completed"];
  const byStatus: Record<string, number> = {};
  const sales: Record<string, { orders: number; total: number }> = {};
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + r.orders;
    if (counted.includes(r.status)) {
      const s = (sales[r.currency] ??= { orders: 0, total: 0 });
      s.orders += r.orders;
      s.total += Number(r.total);
    }
  }
  return {
    totalOrders: Object.values(byStatus).reduce((a, b) => a + b, 0),
    byStatus,
    sales,
    bestSellers: unwrap(sellers, "best sellers") as { product_id: string; name: string; sku: string; currency: string; units: number; revenue: number }[],
    recent: unwrap(recent, "recent orders") as any[],
    lowStock: unwrap(lowStock, "low stock") as any[],
    productCount: productCount.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    activePromotions: activePromotions.count ?? 0,
  };
}

export type ProductFilters = { status: "" | "active" | "hidden"; categorySlugs: string[] | null; sort: "new" | "name" };

export async function listProducts(q: string, page: number, f: ProductFilters = { status: "", categorySlugs: null, sort: "new" }) {
  let query = adminClient()
    .from("products")
    .select("id, sku, name_en, brand_slug, category_slug, subcategory_slug, condition, active, is_demo, images, product_prices(country_code, price, stock, available)", { count: "exact" });
  if (f.status) query = query.eq("active", f.status === "active");
  if (f.categorySlugs) {
    const list = f.categorySlugs.length ? f.categorySlugs.join(",") : "-";
    query = query.or(`category_slug.in.(${list}),subcategory_slug.in.(${list})`);
  }
  const term = q.trim().replace(/[%,()]/g, " ");
  if (term) query = query.or(`name_en.ilike.%${term}%,sku.ilike.%${term}%,id.ilike.%${term}%`);
  query = f.sort === "name" ? query.order("name_en") : query.order("created_at", { ascending: false });
  const res = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  return { rows: unwrap(res, "products") as any[], total: res.count ?? 0 };
}

export async function getProduct(id: string): Promise<ProductRecord | null> {
  const { data, error } = await adminClient().from("products").select("*, product_prices(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? ((mappers as any).mapProduct ? (mappers as any).mapProduct(data) : null) : null;
}

export async function listCategories(): Promise<CategoryRecord[]> {
  const rows = unwrap(await adminClient().from("categories").select("*").order("sort"), "categories") as any[];
  return rows.map((r) => ({ slug: r.slug, name: { en: r.name_en, ar: r.name_ar }, parent: r.parent_slug, sort: r.sort, active: r.active !== false, image: r.image_url ?? null }));
}

/** False until supabase/migrations/20261022000200_category_hierarchy.sql has been applied (categories.active missing). */
export async function categoryVisibilityReady(): Promise<boolean> {
  const { error } = await adminClient().from("categories").select("active").limit(1);
  return !error;
}

export async function listBrands(): Promise<BrandRecord[]> {
  const rows = unwrap(await adminClient().from("brands").select("*").order("name"), "brands") as any[];
  return rows.map((r) => ({ slug: r.slug, name: r.name, isDemo: !!r.is_demo }));
}

export async function listPromotions(): Promise<PromotionRecord[]> {
  const rows = unwrap(await adminClient().from("promotions").select("*").order("sort"), "promotions") as any[];
  return rows.map(mappers.mapPromotion);
}

export async function listCountries(): Promise<CountryRecord[]> {
  const rows = unwrap(await adminClient().from("countries").select("*"), "countries") as any[];
  const out = { ...defaultCountries };
  for (const r of rows) out[r.code as keyof typeof out] = mappers.mapCountry(r);
  return countryCodes.map((c) => out[c]);
}

export async function listInventory(q: string, page = 1) {
  let query = adminClient()
    .from("products")
    .select("id, sku, name_en, active, product_prices(country_code, price, stock, available)", { count: "exact" })
    .order("name_en");
  const term = q.trim().replace(/[%,()]/g, " ");
  if (term) query = query.or(`name_en.ilike.%${term}%,sku.ilike.%${term}%`);
  const res = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  return { rows: unwrap(res, "inventory") as any[], total: res.count ?? 0 };
}

export async function listOrders(f: { q: string; status: string; country: string; page: number }) {
  let query = adminClient()
    .from("orders")
    .select("id, order_code, country_code, customer_name, customer_phone, total, currency, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE - 1);
  if (f.status) query = query.eq("status", f.status);
  if (f.country) query = query.eq("country_code", f.country);
  const term = f.q.trim().replace(/[%,()]/g, " ");
  if (term) query = query.or(`order_code.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`);
  const res = await query;
  return { rows: unwrap(res, "orders") as any[], total: res.count ?? 0 };
}

export async function getOrder(id: string) {
  const db = adminClient();
  const { data: order, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;
  const items = unwrap(await db.from("order_items").select("*").eq("order_id", id).order("name"), "order items") as any[];
  return { order: order as any, items };
}

/** Products per category, counting each product under its main category, subcategory and every level between. */
export async function getCategoryProductCounts(categories: CategoryRecord[]): Promise<Record<string, number>> {
  const db = adminClient();
  const rows = await fetchAllPages<{ category_slug: string; subcategory_slug: string | null }>((from, to) =>
    db.from("products").select("category_slug, subcategory_slug").order("id").range(from, to),
  );
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const slugs = new Set([...ancestry(categories, r.category_slug), ...ancestry(categories, r.subcategory_slug)].map((c) => c.slug));
    for (const s of slugs) counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}
