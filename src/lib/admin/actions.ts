"use server";

import { ancestry } from "@/lib/categories";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { countryCodes } from "@/i18n/config";
import { requireAction } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/server";
import { collectValues, duplicateField, imageAllowed, parseProductForm, type ParsedProduct, type ProductFieldErrors, type ProductFormState } from "@/lib/admin/product-form";
import { lines, slugRe, toNumber } from "@/lib/validators";
import { orderStatuses, type OrderStatus } from "@/types/catalog";

// Every action: 1) re-verifies the signed-in admin on the server, 2) validates all input, 3) writes with the
// service-role client (never exposed to the browser), 4) revalidates the storefront cache.

const str = (fd: FormData, k: string, max = 500) =>
  String(fd.get(k) ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const bool = (fd: FormData, k: string) => fd.get(k) === "on";

function fail(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${encodeURIComponent(message)}`);
}
function done(path: string): never {
  revalidatePath("/", "layout");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}saved=1`);
}
/** Technical details go to the server log only; the admin sees a short, safe message. */
const safeMessage = (e: { code?: string; message: string }) => {
  if (e.code === "23505") return "That ID / SKU / slug already exists.";
  if (e.code === "23503") return "It is still referenced by other records.";
  console.error("admin database error", e.code, e.message);
  return `The database rejected this change${e.code ? ` (code ${e.code})` : ""}. Nothing was changed. If it keeps happening, contact your developer.`;
};
const dbError = (path: string, e: { code?: string; message: string }): never => fail(path, safeMessage(e));

// Images must be local (/products/...) or live in this project's Supabase Storage (the hosts next/image allows).
const imageOk = (u: string) => imageAllowed(u);

// ------------------------------------------------------------------ products
type Db = ReturnType<typeof adminClient>;
type PgError = { code?: string; message: string; details?: string };

const productFail = (fd: FormData, errors: ProductFieldErrors, message?: string): ProductFormState => ({ errors, message, values: collectValues(fd), nonce: Date.now() });

/** Message for errors that aren't tied to one field. */
const friendly = (e: PgError) => (e.code === "23503" ? "A brand or category used by this product no longer exists. Reload the page and choose again." : safeMessage(e));

/**
 * Saves a product and its country prices in ONE database transaction by calling the `save_product` function
 * (supabase/migrations/20261022000300_save_product_function.sql). Until that migration has been applied the function
 * does not exist; then we fall back to separate writes and undo them if a later step fails.
 * Returns null on success, or the error to show.
 */
async function persistProduct(db: Db, create: boolean, p: ParsedProduct): Promise<{ errors: ProductFieldErrors; message?: string } | null> {
  const row = { ...p.row, updated_at: new Date().toISOString() };
  const asError = (e: PgError): { errors: ProductFieldErrors; message?: string } => {
    const dup = duplicateField(e);
    if (dup === "sku") return { errors: { sku: "This SKU is already used by another product." } };
    if (dup === "id") return { errors: { id: "A product with this ID already exists." } };
    return { errors: {}, message: friendly(e) };
  };

  const rpc = await db.rpc("save_product", { p_create: create, p_product: row, p_prices: p.prices, p_remove: p.removeFrom });
  if (!rpc.error) return null;
  const missing = rpc.error.code === "PGRST202" || /could not find the function/i.test(rpc.error.message);
  if (!missing) return asError(rpc.error);

  // ---- fallback: separate writes with a best-effort undo -------------------------------------------------
  if (create) {
    const ins = await db.from("products").insert(row);
    if (ins.error) return asError(ins.error);
    const err = await writePrices(db, p);
    if (err) {
      await db.from("products").delete().eq("id", row.id); // the product was created a moment ago by this request
      return { errors: {}, message: `The product was NOT created because its prices could not be saved (database error). Please try again.` };
    }
    return null;
  }
  const [prevRow, prevPrices] = await Promise.all([db.from("products").select("*").eq("id", row.id).maybeSingle(), db.from("product_prices").select("*").eq("product_id", row.id)]);
  const upd = await db.from("products").update(row).eq("id", row.id);
  if (upd.error) return asError(upd.error);
  const err = await writePrices(db, p);
  if (err) {
    if (prevRow.data) await db.from("products").update(prevRow.data).eq("id", row.id);
    await db.from("product_prices").delete().eq("product_id", row.id);
    if (prevPrices.data?.length) await db.from("product_prices").insert(prevPrices.data);
    return { errors: {}, message: `Your changes were NOT saved because the prices could not be updated (database error). The previous values were restored — please check the product and try again.` };
  }
  return null;
}

async function writePrices(db: Db, p: ParsedProduct): Promise<PgError | null> {
  if (p.removeFrom.length) {
    const r = await db.from("product_prices").delete().eq("product_id", p.row.id).in("country_code", p.removeFrom);
    if (r.error) return r.error;
  }
  if (p.prices.length) {
    const r = await db.from("product_prices").upsert(p.prices, { onConflict: "product_id,country_code" });
    if (r.error) return r.error;
  }
  return null;
}

export async function saveProduct(_prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  await requireAction("admin");
  const create = str(fd, "mode") === "create";
  const db = adminClient();

  const [brands, cats, countries] = await Promise.all([db.from("brands").select("slug"), db.from("categories").select("slug, parent_slug"), db.from("countries").select("code, currency_decimals")]);
  if (brands.error || cats.error) return productFail(fd, {}, "Couldn't load brands and categories from the database. Nothing was saved — please try again.");

  const { errors, parsed } = parseProductForm(fd, {
    create,
    brandSlugs: (brands.data ?? []).map((b) => b.slug as string),
    categories: (cats.data ?? []).map((c) => ({ slug: c.slug as string, parent: c.parent_slug as string | null })),
    decimals: Object.fromEntries((countries.data ?? []).map((c) => [c.code, Number(c.currency_decimals)])),
  });
  if (!parsed) return productFail(fd, errors, "Nothing was saved. Please fix the highlighted fields.");
  const { row } = parsed;

  // Friendly duplicate / missing-product checks (the database constraints remain the final guard).
  const dup: ProductFieldErrors = {};
  const [byId, bySku] = await Promise.all([
    db.from("products").select("id").eq("id", row.id).maybeSingle(),
    db.from("products").select("id, name_en").eq("sku", row.sku).neq("id", row.id).maybeSingle(),
  ]);
  if (create && byId.data) dup.id = `A product with the ID “${row.id}” already exists. Choose a different ID.`;
  if (bySku.data) dup.sku = `The SKU “${row.sku}” is already used by “${bySku.data.name_en}” (${bySku.data.id}). SKUs must be unique.`;
  if (Object.keys(dup).length) return productFail(fd, dup, "Nothing was saved. Please fix the highlighted fields.");
  if (!create && !byId.data) return productFail(fd, {}, "This product no longer exists (it may have been deleted in another window). Nothing was saved.");

  // Orders change stock while a form is open. If the admin did not touch a country's stock field, keep the live value
  // instead of overwriting it with the (possibly stale) number the form was opened with.
  if (!create) {
    const live = await db.from("product_prices").select("country_code, stock").eq("product_id", row.id);
    if (!live.error) {
      for (const pr of parsed.prices) {
        const opened = toNumber(fd.get(`orig_stock_${pr.country_code}`));
        const now = live.data?.find((l) => l.country_code === pr.country_code)?.stock;
        if (opened !== null && now !== undefined && pr.stock === opened) pr.stock = now;
      }
    }
  }

  const failed = await persistProduct(db, create, parsed);
  if (failed) return productFail(fd, failed.errors, failed.message ?? "Nothing was saved. Please fix the highlighted fields.");
  done("/admin/products");
}

/** Hide or show a product in the shop without deleting it. */
export async function setProductVisibility(fd: FormData) {
  await requireAction("admin");
  const id = str(fd, "id", 80);
  const { data, error } = await adminClient().from("products").update({ active: str(fd, "active") === "1", updated_at: new Date().toISOString() }).eq("id", id).select("id");
  if (error) dbError("/admin/products", error);
  if (!data?.length) fail("/admin/products", "That product no longer exists.");
  done("/admin/products");
}

export async function deleteProduct(fd: FormData) {
  await requireAction("admin");
  const id = str(fd, "id", 80);
  const promos = await promotionsTargeting("product", id);
  if (promos.length) fail("/admin/products", `Can't delete: the promotion "${promos[0]}" targets this product. Hide the product instead, or change the promotion first.`);
  const { error } = await adminClient().from("products").delete().eq("id", id);
  if (error) dbError("/admin/products", error);
  done("/admin/products");
}

// ------------------------------------------------------------------ inventory
export async function updateStock(fd: FormData) {
  await requireAction("admin");
  const id = str(fd, "product_id", 80);
  const country = str(fd, "country", 10);
  const stock = toNumber(fd.get("stock"));
  const back = "/admin/inventory";
  if (!(countryCodes as readonly string[]).includes(country)) fail(back, "Unknown country.");
  if (stock === null || !Number.isInteger(stock) || stock < 0 || stock > 1_000_000) fail(back, "Stock must be a whole number.");
  const { data, error } = await adminClient().from("product_prices").update({ stock, available: bool(fd, "available") }).eq("product_id", id).eq("country_code", country).select("product_id");
  if (error) dbError(back, error);
  if (!data?.length) fail(back, "That product is no longer sold in this country, so nothing was changed. Reload the page.");
  done(back);
}

// ------------------------------------------------------------------ categories & brands
export async function saveCategory(fd: FormData) {
  await requireAction("admin");
  const back = "/admin/categories";
  const slug = str(fd, "slug", 80);
  if (!slugRe.test(slug)) fail(back, "Slug must be lowercase letters, numbers and dashes.");
  const nameEn = str(fd, "name_en", 120);
  if (!nameEn) fail(back, "English name is required.");
  const parent = str(fd, "parent_slug") || null;
  if (parent === slug) fail(back, "A category can't be its own parent.");
  const db = adminClient();
  if (parent) {
    // Keep the tree at most three levels deep and cycle-free.
    const { data: all } = await db.from("categories").select("slug, parent_slug");
    const recs = (all ?? []).map((c) => ({ slug: c.slug as string, parent: c.parent_slug as string | null, name: { en: "", ar: "" }, sort: 0, active: true }));
    const chain = ancestry(recs, parent);
    if (!chain.length) fail(back, "Parent category not found.");
    if (chain.some((c) => c.slug === slug)) fail(back, "A category can't be moved under its own subcategory.");
    const below = (s: string, seen: string[] = []): number => {
      const kids = recs.filter((c) => c.parent === s && !seen.includes(c.slug));
      return kids.length ? 1 + Math.max(...kids.map((k) => below(k.slug, [...seen, s]))) : 0;
    };
    // levels above (parent chain) + this category + its own subcategories must fit in three levels
    if (chain.length + 1 + below(slug) > 3) fail(back, "Categories can be at most three levels deep (main category > subcategory > type).");
  }
  // Visibility: the form sends "0" (hidden input) then "1" (checkbox, only when ticked); the last value wins.
  // Anything else / absent => new categories are visible, existing ones keep their current visibility.
  const vis = fd.getAll("active").map(String).at(-1);
  const create = str(fd, "mode") === "create";
  const row: Record<string, unknown> = { slug, name_en: nameEn, name_ar: str(fd, "name_ar", 120), parent_slug: parent, sort: Math.trunc(toNumber(fd.get("sort")) ?? 0) };
  // Optional picture. Only written when it changed (or on create with one), so saving a category keeps working
  // before the image_url migration is applied.
  const image = str(fd, "image_url", 600);
  if (image && !imageAllowed(image)) fail(back, "Category image must be uploaded here (Supabase Storage) or be a /products/ path.");
  if (image !== str(fd, "orig_image_url", 600) && (image || !create)) row.image_url = image || null;
  if (vis === "1" || vis === "0") row.active = vis === "1";
  else if (create) row.active = true;
  const res = create ? await db.from("categories").insert(row) : await db.from("categories").update(row).eq("slug", slug).select("slug");
  const { error } = res;
  if (error?.message.includes("'image_url' column")) fail(back, "The category image database update has not been applied yet (supabase/migrations/20261022000400_category_images.sql). Your other changes were not saved either - apply it, then try again.");
  if (error?.message.includes("'active' column")) fail(back, "Run the category database update first (supabase/migrations/20261022000200_category_hierarchy.sql in the Supabase SQL Editor).");
  if (error) dbError(back, error);
  if (!create && !(res.data as unknown[] | null)?.length) fail(back, "That category no longer exists. Reload the page.");
  done(back);
}

/** Titles of promotions that point at a category / brand / product, so deleting it cannot leave a dangling promotion. */
async function promotionsTargeting(scope: "category" | "brand" | "product", value: string) {
  const { data } = await adminClient().from("promotions").select("title_en").eq("scope", scope).eq("scope_value", value);
  return (data ?? []).map((p) => p.title_en as string);
}

export async function deleteCategory(fd: FormData) {
  await requireAction("admin");
  const slug = str(fd, "slug", 80);
  const promos = await promotionsTargeting("category", slug);
  if (promos.length) fail("/admin/categories", `Can't delete: the promotion "${promos[0]}" targets this category. Change or delete the promotion first, or hide the category instead.`);
  const { error } = await adminClient().from("categories").delete().eq("slug", slug);
  if (error) fail("/admin/categories", error.code === "23503" ? "Can't delete: products or subcategories still use this category." : safeMessage(error));
  done("/admin/categories");
}

export async function saveBrand(fd: FormData) {
  await requireAction("admin");
  const back = "/admin/brands";
  const slug = str(fd, "slug", 80);
  const name = str(fd, "name", 120);
  if (!slugRe.test(slug)) fail(back, "Slug must be lowercase letters, numbers and dashes.");
  if (!name) fail(back, "Brand name is required.");
  const row = { slug, name, is_demo: bool(fd, "is_demo") };
  const db = adminClient();
  const create = str(fd, "mode") === "create";
  const res = create ? await db.from("brands").insert(row) : await db.from("brands").update(row).eq("slug", slug).select("slug");
  if (res.error) dbError(back, res.error);
  if (!create && !(res.data as unknown[] | null)?.length) fail(back, "That brand no longer exists. Reload the page.");
  done(back);
}

export async function deleteBrand(fd: FormData) {
  await requireAction("admin");
  const slug = str(fd, "slug", 80);
  const promos = await promotionsTargeting("brand", slug);
  if (promos.length) fail("/admin/brands", `Can't delete: the promotion "${promos[0]}" targets this brand. Change or delete the promotion first.`);
  const { error } = await adminClient().from("brands").delete().eq("slug", slug);
  if (error) fail("/admin/brands", error.code === "23503" ? "Can't delete: products still use this brand." : safeMessage(error));
  done("/admin/brands");
}

// ------------------------------------------------------------------ promotions
export async function savePromotion(fd: FormData) {
  await requireAction("admin");
  const back = "/admin/promotions";
  const titleEn = str(fd, "title_en", 160);
  if (!titleEn) fail(back, "English title is required.");
  const percent = toNumber(fd.get("discount_percent")) ?? 0;
  if (percent < 0 || percent > 90) fail(back, "Discount must be between 0 and 90%.");
  const scope = str(fd, "scope");
  if (!["all", "category", "brand", "product"].includes(scope)) fail(back, "Invalid scope.");
  const scopeValue = scope === "all" ? null : str(fd, "scope_value", 80) || null;
  if (scope !== "all" && !scopeValue) fail(back, "Choose what the discount applies to.");
  if (scopeValue) {
    const table = { category: ["categories", "slug"], brand: ["brands", "slug"], product: ["products", "id"] }[scope as "category" | "brand" | "product"];
    const { data: hit } = await adminClient().from(table[0]).select(table[1]).eq(table[1], scopeValue).maybeSingle();
    if (!hit) fail(back, `No ${scope} with the ${scope === "product" ? "ID" : "slug"} "${scopeValue}" exists. Check the spelling - a promotion with a wrong target never applies to anything.`);
  }
  const country = str(fd, "country_code");
  const link = str(fd, "link_path", 200);
  if (link && !link.startsWith("/")) fail(back, "Link must start with / (e.g. /pre-owned).");
  const image = str(fd, "image_url", 500);
  if (image && !imageOk(image)) fail(back, "Image must be uploaded here (Supabase Storage) or be a /products/ path.");
  const date = (k: string) => {
    const v = str(fd, k);
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) fail(back, "Invalid date.");
    return d.toISOString();
  };
  const row = {
    title_en: titleEn,
    title_ar: str(fd, "title_ar", 160),
    subtitle_en: str(fd, "subtitle_en", 200),
    subtitle_ar: str(fd, "subtitle_ar", 200),
    image_url: image || null,
    link_path: link || null,
    discount_percent: percent,
    scope,
    scope_value: scopeValue,
    country_code: (countryCodes as readonly string[]).includes(country) ? country : null,
    starts_at: date("starts_at"),
    ends_at: date("ends_at"),
    active: bool(fd, "active"),
    sort: Math.trunc(toNumber(fd.get("sort")) ?? 0),
  };
  const id = str(fd, "id", 80);
  const db = adminClient();
  const res = id ? await db.from("promotions").update(row).eq("id", id).select("id") : await db.from("promotions").insert(row);
  if (res.error) dbError(back, res.error);
  if (id && !(res.data as unknown[] | null)?.length) fail(back, "That promotion no longer exists. Reload the page.");
  done(back);
}

export async function deletePromotion(fd: FormData) {
  await requireAction("admin");
  const { error } = await adminClient().from("promotions").delete().eq("id", str(fd, "id", 80));
  if (error) dbError("/admin/promotions", error);
  done("/admin/promotions");
}

// ------------------------------------------------------------------ orders (staff may update status)
export async function updateOrderStatus(fd: FormData) {
  await requireAction("staff");
  const id = str(fd, "order_id", 60);
  const status = str(fd, "status") as OrderStatus;
  const back = str(fd, "back") || "/admin/orders";
  if (!back.startsWith("/admin/")) fail("/admin/orders", "Invalid redirect.");
  if (!orderStatuses.includes(status)) fail(back, "Invalid status.");
  const { error } = await adminClient().rpc("set_order_status", { p_order: id, p_status: status });
  if (error) fail(back, /order not found/i.test(error.message) ? "That order no longer exists." : safeMessage(error));
  done(back);
}

// ------------------------------------------------------------------ country settings
export async function saveCountry(fd: FormData) {
  await requireAction("admin");
  const code = str(fd, "code", 10);
  const back = "/admin/settings";
  if (!(countryCodes as readonly string[]).includes(code)) fail(back, "Unknown country.");
  const whatsapp = str(fd, "whatsapp_number", 20).replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15)) fail(back, "WhatsApp number: use international format, digits only (e.g. 971501234567).");
  const email = str(fd, "email", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail(back, "Invalid email address.");
  const fee = toNumber(fd.get("delivery_fee")) ?? 0;
  const free = toNumber(fd.get("free_delivery_over"));
  if (fee < 0 || (free !== null && free < 0)) fail(back, "Delivery amounts can't be negative.");
  const regions = lines(fd.get("regions")).map((l) => {
    const [en, ar] = l.split("|").map((s) => s.trim());
    return { en, ar: ar ?? "" };
  }).filter((r) => r.en);
  const hours = lines(fd.get("hours")).map((l) => {
    const [dEn, dAr, tEn, tAr] = l.split("|").map((s) => s.trim());
    return { days: { en: dEn ?? "", ar: dAr ?? "" }, time: { en: tEn ?? "", ar: tAr ?? "" } };
  }).filter((h) => h.days.en);
  const openDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => bool(fd, `day_${d}`));
  const openHour = Math.trunc(toNumber(fd.get("open_hour")) ?? 0);
  const closeHour = Math.trunc(toNumber(fd.get("close_hour")) ?? 0);
  if (openHour < 0 || openHour > 23 || closeHour < 0 || closeHour > 24) fail(back, "Hours must be between 0 and 24.");
  const mapsEmbed = str(fd, "maps_embed", 600);
  if (mapsEmbed && !/^https:\/\/(www\.)?(google\.com|maps\.google\.com)\//.test(mapsEmbed)) fail(back, "Map embed URL must be a Google Maps https URL.");

  const row = {
    name_en: str(fd, "name_en", 80),
    name_ar: str(fd, "name_ar", 80),
    whatsapp_number: whatsapp,
    phone: str(fd, "phone", 30),
    phone_display: str(fd, "phone_display", 40),
    email,
    address_en: str(fd, "address_en", 300),
    address_ar: str(fd, "address_ar", 300),
    maps_link: str(fd, "maps_link", 500),
    maps_embed: mapsEmbed,
    delivery_info_en: str(fd, "delivery_info_en", 600),
    delivery_info_ar: str(fd, "delivery_info_ar", 600),
    delivery_fee: fee,
    free_delivery_over: free,
    regions,
    hours,
    open_days: openDays,
    open_hour: openHour,
    close_hour: closeHour,
    enabled: bool(fd, "enabled"),
    updated_at: new Date().toISOString(),
  };
  if (!row.name_en) fail(back, "Country name is required.");
  const { error } = await adminClient().from("countries").update(row).eq("code", code);
  if (error) dbError(back, error);
  done(back);
}
