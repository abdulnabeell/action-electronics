"use client";

import { useLocale } from "@/components/LocaleProvider";
import { fmt } from "@/i18n/dictionaries";

export function DiscountBadge({ pct, className = "" }: { pct: number | null; className?: string }) {
  const { dict } = useLocale();
  if (!pct) return null;
  return (
    <span className={`rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white ${className}`}>
      {fmt(dict.product.off, { n: pct })}
    </span>
  );
}

export default function Price({
  price,
  compareAt,
  size = "md",
}: {
  price: number;
  compareAt: number | null;
  size?: "md" | "lg";
}) {
  const { money } = useLocale();
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <bdi className={`${size === "lg" ? "text-3xl" : "text-base"} font-extrabold`}>{money(price)}</bdi>
      {compareAt && (
        <bdi className={`${size === "lg" ? "text-base" : "text-xs"} text-slate-500 line-through`}>{money(compareAt)}</bdi>
      )}
    </p>
  );
}
