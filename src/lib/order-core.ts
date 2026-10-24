import type { CountryCode, Lang } from "../i18n/config.ts";
import { formatMoney, roundMoney } from "./pricing.ts";

export type Method = "delivery" | "pickup";

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  region: string;
  method: Method;
  address: string;
  notes: string;
};

export type OrderLine = { id: string; sku: string; name: string; qty: number; unitPrice: number };

export type OrderTotals = { subtotal: number; deliveryFee: number; total: number };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion when read aloud

export function generateOrderCode(country: CountryCode, now: Date, random: (n: number) => Uint8Array) {
  const prefix = country === "oman" ? "OM" : "AE";
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = Array.from(random(6), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${prefix}-${yy}${mm}${dd}-${suffix}`;
}

export function computeTotals(
  lines: Pick<OrderLine, "qty" | "unitPrice">[],
  opts: { method: Method; deliveryFee: number; freeDeliveryOver: number | null; decimals: number },
): OrderTotals {
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0), opts.decimals);
  let deliveryFee = 0;
  if (opts.method === "delivery" && lines.length > 0) {
    const free = opts.freeDeliveryOver !== null && subtotal >= opts.freeDeliveryOver;
    deliveryFee = free ? 0 : roundMoney(opts.deliveryFee, opts.decimals);
  }
  return { subtotal, deliveryFee, total: roundMoney(subtotal + deliveryFee, opts.decimals) };
}

const labels = {
  en: {
    title: "New order",
    id: "Order ID",
    items: "Items",
    subtotal: "Subtotal",
    delivery: "Delivery",
    free: "Free",
    tbc: "To be confirmed on WhatsApp",
    total: "Total",
    customer: "Customer",
    name: "Name",
    phone: "Phone",
    email: "Email",
    region: "Region",
    method: "Method",
    delivery_: "Delivery",
    pickup: "Store pickup",
    address: "Address",
    notes: "Notes",
    sku: "SKU",
    footer: "Please confirm availability and payment details. Thank you!",
  },
  ar: {
    title: "طلب جديد",
    id: "رقم الطلب",
    items: "المنتجات",
    subtotal: "المجموع الفرعي",
    delivery: "التوصيل",
    free: "مجاني",
    tbc: "يتم تأكيده عبر واتساب",
    total: "الإجمالي",
    customer: "العميل",
    name: "الاسم",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    region: "المنطقة",
    method: "الطريقة",
    delivery_: "توصيل",
    pickup: "استلام من المتجر",
    address: "العنوان",
    notes: "ملاحظات",
    sku: "رمز المنتج",
    footer: "يرجى تأكيد التوفر وتفاصيل الدفع. شكراً لكم!",
  },
} as const;

export function buildWhatsAppMessage(input: {
  code: string;
  lang: Lang;
  storeName: string;
  currency: string;
  decimals: number;
  lines: OrderLine[];
  totals: OrderTotals;
  customer: OrderCustomer;
  /** Delivery fee isn't configured for this country, so staff confirm it with the customer. */
  deliveryTbc?: boolean;
}) {
  const t = labels[input.lang];
  const money = (n: number) => formatMoney(n, input.currency, input.decimals, "en"); // plain digits in messages
  const out: string[] = [
    `*${t.title} - ${input.storeName}*`,
    `*${t.id}: ${input.code}*`,
    "",
    `*${t.items}*`,
    ...input.lines.map(
      (l, i) => `${i + 1}. ${l.name} (${t.sku} ${l.sku}) - ${l.qty} x ${money(l.unitPrice)} = ${money(l.unitPrice * l.qty)}`,
    ),
    "",
    `${t.subtotal}: ${money(input.totals.subtotal)}`,
    ...(input.customer.method === "delivery"
      ? [`${t.delivery}: ${input.totals.deliveryFee > 0 ? money(input.totals.deliveryFee) : input.deliveryTbc ? t.tbc : t.free}`]
      : []),
    `*${t.total}: ${money(input.totals.total)}*`,
    "",
    `*${t.customer}*`,
    `${t.name}: ${input.customer.name}`,
    `${t.phone}: ${input.customer.phone}`,
  ];
  if (input.customer.email) out.push(`${t.email}: ${input.customer.email}`);
  out.push(`${t.method}: ${input.customer.method === "delivery" ? t.delivery_ : t.pickup}`);
  if (input.customer.region) out.push(`${t.region}: ${input.customer.region}`);
  if (input.customer.method === "delivery" && input.customer.address) out.push(`${t.address}: ${input.customer.address}`);
  if (input.customer.notes) out.push(`${t.notes}: ${input.customer.notes}`);
  out.push("", t.footer);
  return out.join("\n");
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
