import { countryCodes, type CountryCode } from "../../i18n/config.ts";
import { isWithin } from "../categories.ts";
import { lines, slugRe, toNumber } from "../validators.ts";

// Pure parsing + validation of the admin product form (no database, no framework) so it can be unit-tested.
// Every problem is reported against the field that caused it, so the form can show it next to that field.

/** Raw submitted text values, keyed by field name. Sent back to the browser so nothing the admin typed is lost. */
export type ProductFormValues = Record<string, string>;
export type ProductFieldErrors = Record<string, string>;

export type ProductFormState = {
  errors: ProductFieldErrors;
  /** Error that isn't tied to one field (database down, partial failure, ...). */
  message?: string;
  /** Present after a failed save: the values to put back into the form. */
  values?: ProductFormValues;
  /** Changes on every failed save so the form re-mounts with the returned values. */
  nonce?: number;
};

export type ProductRow = {
  id: string;
  sku: string;
  name_en: string;
  name_ar: string;
  brand_slug: string;
  category_slug: string;
  subcategory_slug: string | null;
  condition: "new" | "pre_owned";
  grade: string | null;
  description_en: string;
  description_ar: string;
  specs_en: string[];
  specs_ar: string[];
  images: string[];
  warranty_en: string;
  warranty_ar: string;
  featured: boolean;
  active: boolean;
  is_demo: boolean;
};

export type PriceInput = { product_id: string; country_code: CountryCode; price: number; compare_at: number | null; stock: number; available: boolean };
export type ParsedProduct = { row: ProductRow; prices: PriceInput[]; removeFrom: CountryCode[] };

export const emptyProductState: ProductFormState = { errors: {} };

const clean = (v: FormDataEntryValue | null, max = 500) =>
  String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const on = (fd: FormData, k: string) => fd.get(k) === "on";

/** Images must be local (/products/...) or live in this project's Supabase Storage. */
export const imageAllowed = (u: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) =>
  /^\/products\/[\w.\-]+$/.test(u) || (!!supabaseUrl && u.startsWith(`${supabaseUrl}/storage/v1/object/public/`) && !/\s/.test(u));

export function collectValues(fd: FormData): ProductFormValues {
  const out: ProductFormValues = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export function parseProductForm(
  fd: FormData,
  ctx: {
    create: boolean;
    brandSlugs: string[];
    categories: { slug: string; parent: string | null }[];
    /** Currency decimal places per country (AED 2, OMR 3). Defaults match the countries table. */
    decimals?: Partial<Record<CountryCode, number>>;
  },
): { errors: ProductFieldErrors; parsed?: ParsedProduct } {
  const errors: ProductFieldErrors = {};
  const id = clean(fd.get("id"), 80);
  if (ctx.create) {
    if (!id) errors.id = "Enter a product ID (it becomes the product's web address).";
    else if (!slugRe.test(id)) errors.id = "Use only lowercase letters, numbers and single dashes, e.g. mirrorless-camera-kit.";
  } else if (!id) errors.id = "Missing product ID.";

  const sku = clean(fd.get("sku"), 40);
  if (!sku) errors.sku = "Enter a SKU (your stock code).";
  const nameEn = clean(fd.get("name_en"), 200);
  if (!nameEn) errors.name_en = "Enter the English product name.";

  const condition = clean(fd.get("condition")) === "pre_owned" ? "pre_owned" : "new";
  const images = lines(fd.get("images")).slice(0, 10);
  if (images.some((i) => !imageAllowed(i))) errors.images = "Images must be uploaded here or be /products/ paths. Remove the invalid image and upload it again.";

  const brand = clean(fd.get("brand_slug"));
  if (!brand) errors.brand_slug = "Choose a brand.";
  else if (!ctx.brandSlugs.includes(brand)) errors.brand_slug = "That brand no longer exists. Choose another.";

  const catRecs = ctx.categories.map((c) => ({ ...c, name: { en: "", ar: "" }, sort: 0, active: true }));
  const categorySlug = clean(fd.get("category_slug"));
  const category = ctx.categories.find((c) => c.slug === categorySlug && !c.parent);
  if (!categorySlug) errors.category_slug = "Choose a main category.";
  else if (!category) errors.category_slug = "Choose one of the main categories.";
  const sub = clean(fd.get("subcategory_slug"));
  if (sub && category) {
    if (sub === category.slug) errors.subcategory_slug = "Pick a subcategory below the main category, or leave it empty.";
    else if (!isWithin(catRecs, sub, category.slug)) errors.subcategory_slug = "This subcategory is not under the chosen main category. Choose a matching pair.";
  }

  const prices: PriceInput[] = [];
  const removeFrom: CountryCode[] = [];
  for (const c of countryCodes) {
    if (!on(fd, `sell_${c}`)) {
      removeFrom.push(c);
      continue;
    }
    const label = c.toUpperCase();
    const price = toNumber(fd.get(`price_${c}`));
    const compare = toNumber(fd.get(`compare_${c}`));
    const stockRaw = toNumber(fd.get(`stock_${c}`));
    const stock = stockRaw ?? 0;
    const dp = ctx.decimals?.[c] ?? (c === "oman" ? 3 : 2);
    const places = (n: number) => {
      const t = String(n);
      return t.includes(".") ? t.length - t.indexOf(".") - 1 : 0;
    };
    if (price === null || price < 0 || price > 10_000_000) errors[`price_${c}`] = `Enter a valid ${label} price (0 or more).`;
    else if (places(price) > dp) errors[`price_${c}`] = `${label} prices can have at most ${dp} decimal places.`;
    if (compare !== null && (compare < 0 || compare > 10_000_000)) errors[`compare_${c}`] = `The ${label} compare-at price can't be negative.`;
    else if (compare !== null && places(compare) > dp) errors[`compare_${c}`] = `${label} prices can have at most ${dp} decimal places.`;
    if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) errors[`stock_${c}`] = `${label} stock must be a whole number, 0 or more.`;
    if (price !== null && !errors[`price_${c}`] && !errors[`stock_${c}`] && !errors[`compare_${c}`]) {
      prices.push({ product_id: id, country_code: c, price, compare_at: compare, stock, available: on(fd, `avail_${c}`) });
    }
  }

  if (Object.keys(errors).length) return { errors };
  const row: ProductRow = {
    id,
    sku,
    name_en: nameEn,
    name_ar: clean(fd.get("name_ar"), 200),
    brand_slug: brand,
    category_slug: category!.slug,
    subcategory_slug: sub || null,
    condition,
    grade: condition === "pre_owned" ? clean(fd.get("grade"), 20) || null : null,
    description_en: clean(fd.get("description_en"), 5000),
    description_ar: clean(fd.get("description_ar"), 5000),
    specs_en: lines(fd.get("specs_en")),
    specs_ar: lines(fd.get("specs_ar")),
    images,
    warranty_en: clean(fd.get("warranty_en"), 500),
    warranty_ar: clean(fd.get("warranty_ar"), 500),
    featured: on(fd, "featured"),
    active: on(fd, "active"),
    is_demo: on(fd, "is_demo"),
  };
  return { errors, parsed: { row, prices, removeFrom } };
}

/** Maps a Postgres unique-violation on products to the field that caused it (ID or SKU). */
export function duplicateField(e: { code?: string; message?: string; details?: string }): "id" | "sku" | null {
  if (e.code !== "23505") return null;
  const text = `${e.message ?? ""} ${e.details ?? ""}`;
  if (/products_sku_key|\(sku\)/.test(text)) return "sku";
  if (/products_pkey|\(id\)/.test(text)) return "id";
  return null;
}
