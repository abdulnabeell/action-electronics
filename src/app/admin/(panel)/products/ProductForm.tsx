"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { countryCodes } from "@/i18n/config";
import { saveProduct } from "@/lib/admin/actions";
import { emptyProductState } from "@/lib/admin/product-form";
import { ancestry, buildTree, type CategoryNode } from "@/lib/categories";
import { slugify } from "@/lib/validators";
import type { BrandRecord, CategoryRecord, CountryRecord, ProductRecord } from "@/types/catalog";
import { CardHeader, Field, card } from "../../ui";
import ImageManager from "./ImageManager";

export default function ProductForm({
  product,
  brands,
  categories,
  countries,
}: {
  product?: ProductRecord;
  brands: BrandRecord[];
  categories: CategoryRecord[];
  countries: CountryRecord[];
}) {
  const [state, action, pending] = useActionState(saveProduct, emptyProductState);
  const summary = useRef<HTMLDivElement>(null);
  const idInput = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);
  const [uploading, setUploading] = useState(false);
  const markDirty = useCallback(() => {
    dirty.current = true;
  }, []);
  const create = !product;
  const p = product;
  const v = state.values; // present after a failed save: show exactly what was submitted
  const err = state.errors;
  const errorCount = Object.keys(err).length;

  // After a failed save the form re-mounts with the submitted values; bring the explanation into view.
  useEffect(() => {
    if (state.nonce) {
      summary.current?.focus();
      dirty.current = true; // the failed save did not store anything
    }
  }, [state.nonce]);

  // Warn before leaving the page with unsaved changes (the browser shows its own generic message).
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const text = (k: string, d?: string | number | null) => (v ? (v[k] ?? "") : d === null || d === undefined ? "" : String(d));
  const chk = (k: string, d: boolean) => (v ? v[k] === "on" : d);
  const bad = (k: string) => (err[k] ? "!border-red-500" : "");

  const tree = buildTree(categories, true);
  const flat = (nodes: CategoryNode[], trail: string[] = []): { slug: string; label: string; active: boolean }[] =>
    nodes.flatMap((n) => [{ slug: n.slug, label: [...trail, n.name.en].join(" › "), active: n.active }, ...flat(n.children, [...trail, n.name.en])]);

  // Products created before the category restructure can still store an old main category (e.g. "mobiles") while their
  // subcategory now lives under a new one. Show the current category; the stored value is only changed if an admin saves.
  const resolvedTop = p ? (ancestry(categories, p.subcategory ?? p.category)[0]?.slug ?? p.category) : "";
  const storedCat = p ? categories.find((c) => c.slug === p.category) : undefined;
  const legacy = !!p && !v && resolvedTop !== p.category;
  const images = v ? (v.images ?? "").split("\n").map((s) => s.trim()).filter(Boolean) : (p?.images ?? []);

  return (
    <form key={state.nonce ?? 0} action={action} onChange={markDirty} onSubmit={() => { dirty.current = false; }} className="space-y-4">
      <input type="hidden" name="mode" value={create ? "create" : "update"} />
      {!create && <input type="hidden" name="id" value={p!.id} />}

      {(state.message || errorCount > 0) && (
        <div ref={summary} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 outline-none">
          <p className="font-bold">{state.message ?? "Nothing was saved."}</p>
          {errorCount > 0 && (
            <ul className="mt-1 list-disc ps-5">
              {Object.entries(err).map(([k, m]) => <li key={k}>{m}</li>)}
            </ul>
          )}
          <p className="mt-1 text-xs">Everything you entered, including uploaded images, is still in the form below.</p>
        </div>
      )}

      <section className={`${card} grid gap-3 sm:grid-cols-2`}>
        <CardHeader title="Basic information" description="What the product is and where it appears in the shop." />
        {create && (
          <Field label="Product ID (URL slug)" hint="Lowercase letters, numbers, dashes. It becomes the web address and can't be changed later." error={err.id}>
            <input ref={idInput} name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={text("id")} aria-invalid={!!err.id} className={`input ${bad("id")}`} placeholder="e.g. mirrorless-camera-kit" />
          </Field>
        )}
        <Field label="SKU" hint="Your stock code. Must be unique." error={err.sku}>
          <input name="sku" required maxLength={40} defaultValue={text("sku", p?.sku)} aria-invalid={!!err.sku} className={`input ${bad("sku")}`} />
        </Field>
        <Field label="Name (English)" error={err.name_en}>
          <input name="name_en" required maxLength={200} defaultValue={text("name_en", p?.name.en)} onBlur={(e) => { if (create && idInput.current && !idInput.current.value) idInput.current.value = slugify(e.target.value); }} aria-invalid={!!err.name_en} className={`input ${bad("name_en")}`} />
        </Field>
        <Field label="Name (Arabic)" hint="Optional. Leave empty to show the English name.">
          <input name="name_ar" dir="rtl" maxLength={200} defaultValue={text("name_ar", p?.name.ar)} className="input" />
        </Field>
        <Field label="Brand" error={err.brand_slug}>
          <select name="brand_slug" required defaultValue={text("brand_slug", p?.brand)} aria-invalid={!!err.brand_slug} className={`input ${bad("brand_slug")}`}>
            <option value="" disabled>Choose…</option>
            {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Condition">
          <select name="condition" defaultValue={text("condition", p?.condition ?? "new")} className="input">
            <option value="new">New</option>
            <option value="pre_owned">Pre-Owned</option>
          </select>
        </Field>
        <Field label="Pre-owned grade" hint="Only used for pre-owned items, e.g. A or B.">
          <input name="grade" maxLength={20} defaultValue={text("grade", p?.grade)} className="input" />
        </Field>
        <Field label="Category" error={err.category_slug}>
          <select name="category_slug" required defaultValue={text("category_slug", resolvedTop)} aria-invalid={!!err.category_slug} className={`input ${bad("category_slug")}`}>
            <option value="" disabled>Choose…</option>
            {tree.map((c) => <option key={c.slug} value={c.slug}>{c.name.en}{c.active ? "" : " (hidden)"}</option>)}
          </select>
        </Field>
        <Field label="Subcategory (optional)" hint="Pick the most specific type; it must sit under the chosen category." error={err.subcategory_slug}>
          <select name="subcategory_slug" defaultValue={text("subcategory_slug", p?.subcategory)} aria-invalid={!!err.subcategory_slug} className={`input ${bad("subcategory_slug")}`}>
            <option value="">None</option>
            {tree.map((c) => (
              <optgroup key={c.slug} label={c.name.en}>
                {flat(c.children, [c.name.en]).map((s) => <option key={s.slug} value={s.slug}>{s.label}{s.active ? "" : " (hidden)"}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        {legacy && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 sm:col-span-2">
            This product is still stored under the old category “{storedCat?.name.en ?? p!.category}”. The form shows its current category instead. Nothing changes in the database unless you press Save.
          </p>
        )}
        <div className="flex flex-wrap gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={chk("active", p?.active ?? true)} className="size-4" /> Visible in the shop</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="featured" defaultChecked={chk("featured", p?.featured ?? false)} className="size-4" /> Featured on home page</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="is_demo" defaultChecked={chk("is_demo", p?.isDemo ?? false)} className="size-4" /> Demo / sample product</label>
        </div>
      </section>

      <section className={`${card} grid gap-3 sm:grid-cols-2`}>
        <CardHeader title="Description, specifications & warranty" description="Arabic is optional: when it is empty, customers reading in Arabic see the English text." />
        <Field label="Description (English)"><textarea name="description_en" rows={4} defaultValue={text("description_en", p?.description.en)} className="input !py-2.5" /></Field>
        <Field label="Description (Arabic)"><textarea name="description_ar" dir="rtl" rows={4} defaultValue={text("description_ar", p?.description.ar)} className="input !py-2.5" /></Field>
        <Field label="Specifications (English)" hint="One per line."><textarea name="specs_en" rows={4} defaultValue={text("specs_en", p?.specs.en.join("\n"))} className="input !py-2.5" /></Field>
        <Field label="Specifications (Arabic)" hint="One per line."><textarea name="specs_ar" dir="rtl" rows={4} defaultValue={text("specs_ar", p?.specs.ar.join("\n"))} className="input !py-2.5" /></Field>
        <Field label="Warranty (English)"><input name="warranty_en" maxLength={500} defaultValue={text("warranty_en", p?.warranty.en)} className="input" /></Field>
        <Field label="Warranty (Arabic)"><input name="warranty_ar" dir="rtl" maxLength={500} defaultValue={text("warranty_ar", p?.warranty.ar)} className="input" /></Field>
      </section>

      <section className={card}>
        <div className="mb-3"><CardHeader title="Photos" description="Customers see the first image first." /></div>
        <ImageManager initial={images} onBusyChange={setUploading} onDirty={markDirty} />
        {err.images && <p className="mt-1 text-sm font-semibold text-red-600" role="alert">{err.images}</p>}
      </section>

      <section className={card}>
        <CardHeader title="Prices, stock & availability" description="Set a separate price for each country you sell in." />
        <p className="mb-3 text-xs text-slate-500">Each country has its own price in its own currency — nothing is converted automatically. Untick “Sold here” to hide the product in that country. AED prices take up to 2 decimals, OMR up to 3. “Compare-at” is the higher “was” price used to show a discount.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {countryCodes.map((code) => {
            const c = countries.find((x) => x.code === code)!;
            const row = p?.prices[code];
            return (
              <fieldset key={code} className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-sm font-bold">{c.name.en} ({c.currency})</legend>
                {!create && row && <input type="hidden" name={`orig_stock_${code}`} value={row.stock} />}
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name={`sell_${code}`} defaultChecked={chk(`sell_${code}`, create ? code === "uae" : !!row)} className="size-4" /> Sold here</label>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Price" error={err[`price_${code}`]}><input name={`price_${code}`} type="number" step="any" min="0" defaultValue={text(`price_${code}`, row?.price)} aria-invalid={!!err[`price_${code}`]} className={`input ${bad(`price_${code}`)}`} /></Field>
                  <Field label="Compare-at" error={err[`compare_${code}`]}><input name={`compare_${code}`} type="number" step="any" min="0" defaultValue={text(`compare_${code}`, row?.compareAt)} aria-invalid={!!err[`compare_${code}`]} className={`input ${bad(`compare_${code}`)}`} /></Field>
                  <Field label="Stock" error={err[`stock_${code}`]}><input name={`stock_${code}`} type="number" step="1" min="0" defaultValue={text(`stock_${code}`, row?.stock ?? 0)} aria-invalid={!!err[`stock_${code}`]} className={`input ${bad(`stock_${code}`)}`} /></Field>
                </div>
                <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name={`avail_${code}`} defaultChecked={chk(`avail_${code}`, row?.available ?? true)} className="size-4" /> Available to order</label>
              </fieldset>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button className="btn-primary" disabled={pending || uploading} aria-busy={pending}>{pending ? "Saving…" : uploading ? "Uploading images…" : create ? "Create product" : "Save changes"}</button>
        <a href="/admin/products" className="btn-outline">Cancel</a>
        <span className="text-xs text-slate-500">{uploading ? "Wait for the photos to finish uploading." : "Required fields are marked by your browser."}</span>
      </div>
    </form>
  );
}
