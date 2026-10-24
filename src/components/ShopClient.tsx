"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/Icons";
import { useLocale } from "@/components/LocaleProvider";
import { CategoryThumb } from "@/components/CategoryVisual";
import ProductCard from "@/components/ProductCard";
import { fmt } from "@/i18n/dictionaries";
import type { CategoryView } from "@/lib/catalog";
import type { Condition, ProductView } from "@/types/catalog";

type Sort = "featured" | "priceAsc" | "priceDesc" | "discount" | "name";
const sorts: Sort[] = ["featured", "priceAsc", "priceDesc", "discount", "name"];

export type ShopInitial = { category?: string; sub?: string; leaf?: string; condition?: Condition; sale?: boolean };

export default function ShopClient({
  products,
  categories,
  brands,
  title,
  intro,
  initial = {},
}: {
  products: ProductView[];
  categories: CategoryView[];
  brands: { slug: string; name: string }[];
  title: string;
  intro?: string;
  initial?: ShopInitial;
}) {
  const { dict, lang, info } = useLocale();
  const params = useSearchParams();
  const qp = (k: string) => params.get(k) ?? "";

  const [query, setQuery] = useState(qp("q"));
  const [category, setCategory] = useState(initial.category ?? qp("category"));
  const [sub, setSub] = useState(initial.sub ?? qp("sub"));
  const [leaf, setLeaf] = useState(initial.leaf ?? qp("leaf"));
  const [condition, setCondition] = useState<string>(initial.condition ?? qp("condition"));
  const [brand, setBrand] = useState(qp("brand"));
  const [min, setMin] = useState(qp("min"));
  const [max, setMax] = useState(qp("max"));
  const [sort, setSort] = useState<Sort>((sorts as string[]).includes(qp("sort")) ? (qp("sort") as Sort) : "featured");
  const [inStockOnly, setInStockOnly] = useState(qp("stock") === "1");
  const [saleOnly, setSaleOnly] = useState(initial.sale ?? qp("sale") === "1");
  const [open, setOpen] = useState(false);

  // Keep the URL shareable without triggering navigation.
  useEffect(() => {
    const p = new URLSearchParams();
    const set = (k: string, v: string, skip = "") => v && v !== skip && p.set(k, v);
    set("q", query.trim());
    if (!initial.category) set("category", category);
    set("sub", sub);
    set("leaf", leaf);
    if (!initial.condition) set("condition", condition);
    set("brand", brand);
    set("min", min);
    set("max", max);
    set("sort", sort, "featured");
    if (inStockOnly) p.set("stock", "1");
    if (saleOnly && !initial.sale) p.set("sale", "1");
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [query, category, sub, leaf, condition, brand, min, max, sort, inStockOnly, saleOnly, initial.category, initial.condition, initial.sale]);

  const activeCat = categories.find((c) => c.slug === category);
  const activeSub = activeCat?.children.find((c) => c.slug === sub);

  // Pre-owned page: quick "type" chips (Mobiles, Laptops, Tablets…) built from the products on offer.
  const quickTypes = useMemo(() => {
    if (initial.condition !== "pre_owned") return [];
    const seen = new Map<string, { slug: string; name: string; parent: string; n: number }>();
    for (const p of products) {
      const type = p.categoryPath[1]; // second level: e.g. Mobiles, Laptops, Tablets
      if (p.condition !== "pre_owned" || !type) continue;
      const cur = seen.get(type.slug);
      seen.set(type.slug, { slug: type.slug, name: type.name, parent: p.category.slug, n: (cur?.n ?? 0) + 1 });
    }
    return [...seen.values()];
  }, [products, initial.condition]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lo = min === "" ? null : Number(min);
    const hi = max === "" ? null : Number(max);
    const list = products.filter(
      (p) =>
        (!category || p.category.slug === category) &&
        (!sub || p.categoryPath[1]?.slug === sub) &&
        (!leaf || p.categoryPath[2]?.slug === leaf) &&
        (!condition || p.condition === condition) &&
        (!brand || p.brand.slug === brand) &&
        (!inStockOnly || p.availability === "in_stock" || p.availability === "low_stock") &&
        (!saleOnly || p.discountPct) &&
        (lo === null || Number.isNaN(lo) || p.price >= lo) &&
        (hi === null || Number.isNaN(hi) || p.price <= hi) &&
        (!q || `${p.name} ${p.brand.name} ${p.category.name} ${p.categoryPath.map((c) => c.name).join(" ")} ${p.sku} ${p.description}`.toLowerCase().includes(q)),
    );
    if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
    else if (sort === "discount") list.sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, lang));
    else list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [products, query, category, sub, leaf, condition, brand, min, max, sort, inStockOnly, saleOnly, lang]);

  const reset = () => {
    setQuery("");
    if (!initial.category) setCategory("");
    setSub("");
    setLeaf("");
    if (!initial.condition) setCondition("");
    setBrand("");
    setMin("");
    setMax("");
    setSort("featured");
    setInStockOnly(false);
    if (!initial.sale) setSaleOnly(false);
  };

  const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500";

  const filters = (
    <div className="space-y-4">
      <div>
        <label htmlFor="f-cat" className={label}>{dict.shop.category}</label>
        <select id="f-cat" className="input" value={category} disabled={!!initial.category} onChange={(e) => { setCategory(e.target.value); setSub(""); setLeaf(""); }}>
          <option value="">{dict.shop.all}</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      {activeCat && activeCat.children.length > 0 && (
        <div>
          <label htmlFor="f-sub" className={label}>{dict.shop.subcategory}</label>
          <select id="f-sub" className="input" value={sub} onChange={(e) => { setSub(e.target.value); setLeaf(""); }}>
            <option value="">{dict.shop.all}</option>
            {activeCat.children.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      )}
      {activeSub && activeSub.children.length > 0 && (
        <div>
          <label htmlFor="f-leaf" className={label}>{activeSub.name}</label>
          <select id="f-leaf" className="input" value={leaf} onChange={(e) => setLeaf(e.target.value)}>
            <option value="">{dict.shop.all}</option>
            {activeSub.children.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="f-cond" className={label}>{dict.shop.condition}</label>
        <select id="f-cond" className="input" value={condition} disabled={!!initial.condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="">{dict.shop.all}</option>
          <option value="new">{dict.condition.new}</option>
          <option value="pre_owned">{dict.condition.pre_owned}</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-brand" className={label}>{dict.shop.brand}</label>
        <select id="f-brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">{dict.shop.allBrands}</option>
          {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className={label}>{dict.shop.price} ({info.currency})</legend>
        <div className="grid grid-cols-2 gap-2" dir="ltr">
          <input type="number" inputMode="decimal" min={0} className="input" placeholder={dict.shop.min} aria-label={dict.shop.min} value={min} onChange={(e) => setMin(e.target.value)} />
          <input type="number" inputMode="decimal" min={0} className="input" placeholder={dict.shop.max} aria-label={dict.shop.max} value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
        {dict.shop.inStockOnly}
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={saleOnly} disabled={!!initial.sale} onChange={(e) => setSaleOnly(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
        {dict.shop.onSaleOnly}
      </label>
      <button type="button" onClick={reset} className="btn-outline w-full">{dict.shop.clear}</button>
    </div>
  );

  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      {intro && <p className="mt-1 text-slate-600">{intro}</p>}

      <div className="relative mt-4">
        <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.search.placeholder}
          aria-label={dict.search.label}
          className="input !ps-11"
        />
      </div>

      {activeCat && activeCat.children.length > 0 && !quickTypes.length && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={dict.shop.subcategory}>
          {[{ slug: "", name: dict.shop.all, imageUrl: null as string | null }, ...activeCat.children].map((c) => (
            <button
              key={c.slug || "all"}
              type="button"
              aria-pressed={sub === c.slug}
              onClick={() => { setSub(c.slug); setLeaf(""); }}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border py-1.5 pe-4 ps-1.5 text-sm font-semibold transition ${sub === c.slug ? "border-brand bg-brand text-white" : "border-slate-300 bg-white hover:border-brand"}`}
            >
              {c.slug && <CategoryThumb src={c.imageUrl} />}
              <span className={c.slug ? "" : "ps-2.5"}>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {quickTypes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={dict.shop.subcategory}>
          {[{ slug: "", name: dict.shop.all, parent: "", n: 0 }, ...quickTypes].map((t) => (
            <button
              key={t.slug || "all"}
              type="button"
              aria-pressed={sub === t.slug}
              onClick={() => { setSub(t.slug); setLeaf(""); setCategory(t.parent); }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${sub === t.slug ? "border-brand bg-brand text-white" : "border-slate-300 bg-white hover:border-brand"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside aria-label={dict.shop.filters}>
          <button type="button" className="btn-outline w-full lg:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {dict.shop.filters}
          </button>
          <div className={`${open ? "mt-3 block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-40 lg:block`}>{filters}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500" aria-live="polite">
              {results.length === 1 ? dict.shop.resultsOne : fmt(dict.shop.results, { n: results.length })}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{dict.shop.sort}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !w-auto">
                {sorts.map((s) => <option key={s} value={s}>{dict.shop.sorts[s]}</option>)}
              </select>
            </label>
          </div>

          {results.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold">{dict.shop.noResults}</p>
              <button type="button" onClick={reset} className="btn-outline mt-4">{dict.shop.clear}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
