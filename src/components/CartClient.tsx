"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { TrashIcon, WhatsAppIcon } from "@/components/Icons";
import { useLocale } from "@/components/LocaleProvider";
import ProductImage from "@/components/ProductImage";
import QtyStepper from "@/components/QtyStepper";
import { fmt } from "@/i18n/dictionaries";
import { computeTotals, type Method } from "@/lib/order-core";
import { validateCustomer, type CustomerErrors } from "@/lib/validators";

type Form = { name: string; phone: string; email: string; region: string; method: Method; address: string; notes: string; website: string };
const empty: Form = { name: "", phone: "", email: "", region: "", method: "delivery", address: "", notes: "", website: "" };

export default function CartClient() {
  const { lines, ready, error, retry, unavailable, setQty, remove, clear } = useCart();
  const { dict, info, href, money, country, lang } = useLocale();
  const router = useRouter();
  const [f, setF] = useState<Form>(empty);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  if (!ready) return <div className="container-x py-10 text-slate-500" role="status">{dict.cart.loading}</div>;

  if (error && lines.length === 0) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-extrabold">{dict.cart.title}</h1>
        <p className="mt-2 text-slate-600" role="alert">{dict.cart.loadError}</p>
        <button type="button" onClick={retry} className="btn-primary mt-6">{dict.common.retry}</button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-extrabold">{dict.cart.empty}</h1>
        <p className="mt-2 text-slate-600">{dict.cart.emptyHint}</p>
        {unavailable > 0 && <p className="mt-2 text-sm text-amber-700">{fmt(dict.cart.unavailableItems, { country: info.name })}</p>}
        <Link href={href("/shop")} className="btn-primary mt-6">{dict.cart.browse}</Link>
      </div>
    );
  }

  const totals = computeTotals(lines.map((l) => ({ qty: l.qty, unitPrice: l.price })), {
    method: f.method,
    deliveryFee: info.deliveryFee,
    freeDeliveryOver: info.freeDeliveryOver,
    decimals: info.currencyDecimals,
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const regionValues = info.regions.map((r) => r.value);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const v = validateCustomer(f, regionValues);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    if (!info.whatsappNumber) return setFormError(dict.cart.errNoWhatsapp);

    setBusy(true);
    // Open the tab synchronously (inside the click) so browsers don't block it, then point it at WhatsApp
    // once the order has been saved.
    const wa = window.open("", "_blank");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ country, lang, items: lines.map((l) => ({ id: l.id, qty: l.qty })), customer: v.value, website: f.website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        wa?.close();
        if (data.error === "validation" && data.fields) setErrors(data.fields);
        setFormError(
          data.error === "no_whatsapp" ? dict.cart.errNoWhatsapp : data.error === "stock" || data.error === "items" ? dict.cart.errStock : dict.cart.errServer,
        );
        return;
      }
      if (wa) wa.location.href = data.whatsappUrl;
      clear();
      router.push(`${href(`/order/${data.code}`)}${data.saved ? "" : "?demo=1"}`);
    } catch {
      wa?.close();
      setFormError(dict.cart.errServer);
    } finally {
      setBusy(false);
    }
  };

  const err = (k: keyof CustomerErrors) => {
    const code = errors[k];
    if (!code) return null;
    const msg = { name: dict.cart.errName, phone: dict.cart.errPhone, email: dict.cart.errEmail, region: dict.cart.errRegion, address: dict.cart.errAddress }[k];
    return <p id={`e-${k}`} className="mt-1 text-sm text-red-600" role="alert">{msg}</p>;
  };
  const aria = (k: keyof CustomerErrors) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `e-${k}` : undefined });

  const deliveryLabel =
    f.method === "pickup" ? "—" : totals.deliveryFee > 0 ? money(totals.deliveryFee) : info.deliveryFee === 0 && info.freeDeliveryOver === null ? dict.cart.deliveryTbc : dict.cart.deliveryFree;

  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{dict.cart.title}</h1>
        <button type="button" onClick={clear} className="text-sm font-semibold text-slate-500 hover:text-red-600">{dict.cart.clear}</button>
      </div>
      {unavailable > 0 && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{fmt(dict.cart.unavailableItems, { country: info.name })}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_400px]">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <Link href={href(`/product/${l.slug}`)} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-white sm:size-24">
                <ProductImage src={l.image} alt={l.name} sizes="96px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={href(`/product/${l.slug}`)} className="line-clamp-2 text-sm font-semibold">{l.name}</Link>
                <p className="text-xs text-slate-500">{dict.product.sku}: {l.sku}</p>
                <p className="text-sm text-slate-600"><bdi>{money(l.price)}</bdi></p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <QtyStepper value={l.qty} max={Math.min(20, l.stock)} onChange={(n) => setQty(l.id, n)} />
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold"><bdi>{money(l.price * l.qty)}</bdi></p>
                    <button type="button" onClick={() => remove(l.id)} aria-label={fmt(dict.cart.remove, { name: l.name })} className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <TrashIcon className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-40" noValidate>
          <div className="space-y-1 border-b border-slate-100 pb-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">{dict.cart.subtotal}</span><bdi className="font-semibold">{money(totals.subtotal)}</bdi></div>
            <div className="flex justify-between"><span className="text-slate-600">{dict.cart.delivery}</span><bdi className="font-semibold">{deliveryLabel}</bdi></div>
            <div className="flex justify-between text-base"><span className="font-bold">{dict.cart.total}</span><bdi className="font-extrabold">{money(totals.total)}</bdi></div>
            <p className="pt-1 text-xs text-slate-500">{dict.cart.noPayment}</p>
          </div>

          <h2 className="text-base font-bold">{dict.cart.customerDetails}</h2>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold">{dict.cart.name}</label>
            <input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} {...aria("name")} />
            {err("name")}
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold">{dict.cart.phone}</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder={country === "oman" ? "+968 XXXX XXXX" : "+971 5X XXX XXXX"} className="input text-start" value={f.phone} onChange={(e) => set("phone", e.target.value)} {...aria("phone")} />
            {err("phone")}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">{dict.cart.email}</label>
            <input id="email" type="email" autoComplete="email" dir="ltr" className="input text-start" value={f.email} onChange={(e) => set("email", e.target.value)} {...aria("email")} />
            {err("email")}
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">{dict.cart.method}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["delivery", "pickup"] as const).map((m) => (
                <label key={m} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold ${f.method === m ? "border-brand bg-brand-light text-brand" : "border-slate-300"}`}>
                  <input type="radio" name="method" className="sr-only" checked={f.method === m} onChange={() => set("method", m)} />
                  {m === "delivery" ? dict.cart.delivery_ : dict.cart.pickup}
                </label>
              ))}
            </div>
          </fieldset>
          {f.method === "delivery" && (
            <>
              <div>
                <label htmlFor="region" className="mb-1 block text-sm font-semibold">{dict.cart.region}</label>
                <select id="region" className="input" value={f.region} onChange={(e) => set("region", e.target.value)} {...aria("region")}>
                  <option value="">{dict.cart.selectRegion}</option>
                  {info.regions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {err("region")}
              </div>
              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-semibold">{dict.cart.address}</label>
                <textarea id="address" rows={2} autoComplete="street-address" className="input !py-2.5" placeholder={dict.cart.addressPh} value={f.address} onChange={(e) => set("address", e.target.value)} {...aria("address")} />
                {err("address")}
              </div>
            </>
          )}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-semibold">{dict.cart.notes}</label>
            <textarea id="notes" rows={2} className="input !py-2.5" placeholder={dict.cart.notesPh} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {/* Honeypot: hidden from people, filled by bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} />

          {info.deliveryInfo && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-bold text-slate-700">{dict.cart.deliveryInfo}</p>
              <p className="mt-0.5">{info.deliveryInfo}</p>
            </div>
          )}

          {formError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{formError}</p>}

          <button type="submit" className="btn-wa w-full !min-h-12 text-base" disabled={busy || !info.whatsappNumber}>
            <WhatsAppIcon /> {busy ? dict.cart.sending : dict.cart.submit}
          </button>
          {info.whatsappNumber ? (
            <p className="text-center text-xs text-slate-500">{fmt(dict.cart.opens, { number: `⁦+${info.whatsappNumber}⁩` })}</p>
          ) : (
            <p className="text-center text-xs text-amber-700">{dict.cart.errNoWhatsapp}</p>
          )}
        </form>
      </div>
    </div>
  );
}
