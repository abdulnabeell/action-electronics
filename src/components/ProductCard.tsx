"use client";

import Link from "next/link";
import AddToCart from "@/components/AddToCart";
import { useLocale } from "@/components/LocaleProvider";
import Price, { DiscountBadge } from "@/components/Price";
import ProductImage from "@/components/ProductImage";
import { fmt } from "@/i18n/dictionaries";
import type { ProductView } from "@/types/catalog";

export default function ProductCard({ product }: { product: ProductView }) {
  const { href, dict } = useLocale();
  const url = href(`/product/${product.slug}`);
  const out = product.availability === "out_of_stock";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg">
      <Link href={url} className="relative block aspect-square bg-white" aria-label={product.name}>
        <ProductImage src={product.images[0]} alt={product.name} />
        <span className="absolute start-2 top-2 flex flex-col items-start gap-1">
          <DiscountBadge pct={product.discountPct} />
          {out && <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">{dict.product.outOfStock}</span>}
        </span>
        <span className="absolute end-2 top-2 flex flex-col items-end gap-1">
          {product.condition === "pre_owned" && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">{dict.condition.pre_owned}</span>
          )}
          {product.isDemo && <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-ink">{dict.product.demoBadge}</span>}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{product.category.name}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={url}>{product.name}</Link>
        </h3>
        <p className="text-xs text-slate-500">
          {product.brand.name}
          {product.grade && ` · ${dict.condition.grade} ${product.grade}`}
        </p>
        <p className={`text-xs font-medium ${out ? "text-slate-500" : product.availability === "low_stock" ? "text-amber-700" : "text-green-700"}`}>
          {out ? dict.product.outOfStock : product.availability === "low_stock" ? fmt(dict.product.lowStock, { n: product.stock }) : dict.product.inStock}
        </p>
        <div className="mt-auto pt-2">
          <Price price={product.price} compareAt={product.compareAt} />
        </div>
        <AddToCart product={product} className="btn-primary mt-1 w-full !min-h-10 !px-3" />
      </div>
    </article>
  );
}
