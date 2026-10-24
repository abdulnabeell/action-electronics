import "server-only";
import { randomBytes } from "node:crypto";
import { makeLocale, type CountryCode } from "@/i18n/config";
import { getStorefront } from "@/lib/catalog";
import { buildWhatsAppMessage, computeTotals, generateOrderCode, whatsappLink, type OrderLine } from "@/lib/order-core";
import { adminClient, hasAdminDb } from "@/lib/supabase/server";
import { validateCustomer, type CustomerErrors, type OrderPayload } from "@/lib/validators";
import { demoDataEnabled } from "@/lib/demo-mode";
import { site } from "@/config/site";

export type CreateOrderResult =
  | { ok: true; code: string; whatsappUrl: string; saved: boolean; total: number; currency: string }
  | { ok: false; status: number; error: "validation" | "items" | "stock" | "no_whatsapp" | "db_unavailable" | "server"; fields?: CustomerErrors; productId?: string };

/**
 * Creates an order from a cart. The browser only sends product ids + quantities + customer details:
 * names, prices, delivery fee and totals are all recomputed here from the catalogue, so a tampered
 * request can't change what the customer pays. The order is stored BEFORE the WhatsApp link is returned.
 */
export async function createOrder(payload: OrderPayload): Promise<CreateOrderResult> {
  const sf = await getStorefront(makeLocale(payload.country, payload.lang));
  const country = sf.country;
  const regionValues = country.regions.map((r) => r.en);

  const customer = validateCustomer(payload.customer, regionValues);
  if (!customer.ok) return { ok: false, status: 422, error: "validation", fields: customer.errors };

  if (!country.whatsappNumber) return { ok: false, status: 409, error: "no_whatsapp" };

  const lines: OrderLine[] = [];
  for (const item of payload.items) {
    const p = sf.products.find((x) => x.id === item.id);
    if (!p || p.availability === "unavailable" || p.availability === "out_of_stock") return { ok: false, status: 409, error: "items", productId: item.id };
    if (item.qty > p.stock) return { ok: false, status: 409, error: "stock", productId: item.id };
    lines.push({ id: p.id, sku: p.sku, name: p.name, qty: item.qty, unitPrice: p.price });
  }

  const totals = computeTotals(lines, {
    method: customer.value.method,
    deliveryFee: country.deliveryFee,
    freeDeliveryOver: country.freeDeliveryOver,
    decimals: country.currencyDecimals,
  });

  // Staff read the order message, so keep the region in English like the stored value.
  const makeResult = (code: string, saved: boolean): CreateOrderResult => {
    const message = buildWhatsAppMessage({
      code,
      lang: payload.lang,
      storeName: payload.lang === "ar" ? site.nameAr : site.name,
      currency: country.currency,
      decimals: country.currencyDecimals,
      lines,
      totals,
      customer: customer.value,
      deliveryTbc: country.deliveryFee === 0 && country.freeDeliveryOver === null,
    });
    return { ok: true, code, whatsappUrl: whatsappLink(country.whatsappNumber, message), saved, total: totals.total, currency: country.currency };
  };

  if (!hasAdminDb()) {
    // Without a database nothing can be stored. Allow this only for local development/demo.
    if (process.env.NODE_ENV === "production") return { ok: false, status: 503, error: "db_unavailable" };
    return makeResult(generateOrderCode(country.code as CountryCode, new Date(), (n) => randomBytes(n)), false);
  }

  const db = adminClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode(country.code, new Date(), (n) => randomBytes(n));
    const { error } = await db.rpc("create_order", {
      p_order: {
        order_code: code,
        country_code: country.code,
        lang: payload.lang,
        customer_name: customer.value.name,
        customer_phone: customer.value.phone,
        customer_email: customer.value.email,
        region: customer.value.region,
        method: customer.value.method,
        address: customer.value.address,
        notes: customer.value.notes,
        currency: country.currency,
        subtotal: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        total: totals.total,
        whatsapp_number: country.whatsappNumber,
      },
      p_items: lines.map((l) => ({ product_id: l.id, sku: l.sku, name: l.name, qty: l.qty, unit_price: l.unitPrice, line_total: Math.round(l.unitPrice * l.qty * 1000) / 1000 })),
    });
    if (!error) return makeResult(code, true);
    if (error.code !== "23505") {
      console.error("create_order failed", error.message);
      return { ok: false, status: 500, error: "server" };
    }
    // 23505 = order code collision: try another code.
  }
  return { ok: false, status: 500, error: "server" };
}
