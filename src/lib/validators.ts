import { countryCodes, languages, type CountryCode, type Lang } from "../i18n/config.ts";
import type { Method, OrderCustomer } from "./order-core.ts";

// Hand-written validators (no schema library) shared by API routes and admin server actions.
// They return error *codes*; the UI maps codes to translated messages.

export const MAX_QTY = 20;
export const MAX_LINES = 40;

export type CustomerErrors = Partial<Record<"name" | "phone" | "email" | "region" | "address", string>>;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");

export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? "+" + digits.slice(1).replace(/\D/g, "") : digits.replace(/\D/g, "");
}

export function phoneDigits(raw: string) {
  return raw.replace(/\D/g, "");
}

export function validateCustomer(
  input: unknown,
  regions: string[],
): { ok: true; value: OrderCustomer } | { ok: false; errors: CustomerErrors } {
  const i = (input ?? {}) as Record<string, unknown>;
  const method: Method = i.method === "pickup" ? "pickup" : "delivery";
  const value: OrderCustomer = {
    name: clean(i.name, 100),
    phone: normalizePhone(clean(i.phone, 30)),
    email: clean(i.email, 120),
    region: clean(i.region, 80),
    method,
    address: clean(i.address, 300),
    notes: clean(i.notes, 500),
  };
  const errors: CustomerErrors = {};
  if (value.name.length < 2) errors.name = "name";
  if (phoneDigits(value.phone).length < 7 || phoneDigits(value.phone).length > 15) errors.phone = "phone";
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)) errors.email = "email";
  if (method === "delivery") {
    if (!regions.includes(value.region)) errors.region = "region";
    if (value.address.length < 5) errors.address = "address";
  } else {
    value.region = regions.includes(value.region) ? value.region : "";
    value.address = "";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export type OrderPayload = {
  country: CountryCode;
  lang: Lang;
  items: { id: string; qty: number }[];
  customer: unknown;
};

export function parseOrderPayload(body: unknown): { ok: true; value: OrderPayload } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!(countryCodes as readonly string[]).includes(b.country as string)) return { ok: false, error: "country" };
  if (!(languages as readonly string[]).includes(b.lang as string)) return { ok: false, error: "lang" };
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > MAX_LINES) return { ok: false, error: "items" };
  const merged = new Map<string, number>();
  for (const raw of b.items) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.slice(0, 80) : "";
    const qty = Number(r.qty);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: "items" };
    merged.set(id, Math.min(MAX_QTY, (merged.get(id) ?? 0) + qty));
  }
  return {
    ok: true,
    value: {
      country: b.country as CountryCode,
      lang: b.lang as Lang,
      items: [...merged].map(([id, qty]) => ({ id, qty })),
      customer: b.customer,
    },
  };
}

// ---- admin input helpers ----

export const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function lines(v: unknown): string[] {
  return String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}
