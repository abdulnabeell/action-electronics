import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/config";
import { getStorefront } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Prices the given product ids for one locale. The browser only stores ids + quantities;
// every price shown in the cart comes from here (and is re-checked again when the order is created).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { locale?: string; ids?: unknown } | null;
  if (!body || !isLocale(body.locale) || !Array.isArray(body.ids) || body.ids.length > 60) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const ids = new Set(body.ids.filter((i): i is string => typeof i === "string"));
  const sf = await getStorefront(body.locale);
  const items = sf.products
    .filter((p) => ids.has(p.id) && p.availability !== "out_of_stock" && p.availability !== "unavailable")
    .map((p) => ({ id: p.id, slug: p.slug, sku: p.sku, name: p.name, image: p.images[0] ?? null, price: p.price, compareAt: p.compareAt, stock: p.stock }));
  const found = new Set(items.map((i) => i.id));
  return NextResponse.json({ items, missing: [...ids].filter((i) => !found.has(i)) });
}
