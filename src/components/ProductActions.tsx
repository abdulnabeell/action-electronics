"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { CartIcon, CheckIcon } from "@/components/Icons";
import { useLocale } from "@/components/LocaleProvider";
import QtyStepper from "@/components/QtyStepper";
import type { ProductView } from "@/types/catalog";

export default function ProductActions({ product }: { product: Pick<ProductView, "id" | "availability" | "stock"> }) {
  const { add } = useCart();
  const { dict, href } = useLocale();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.availability === "out_of_stock" || product.availability === "unavailable") {
    return (
      <button className="btn-primary w-full" disabled>
        {product.availability === "unavailable" ? dict.product.unavailable : dict.product.outOfStock}
      </button>
    );
  }
  const max = Math.min(20, product.stock);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{dict.product.quantity}</span>
        <QtyStepper value={qty} max={max} onChange={(n) => setQty(Math.min(max, Math.max(1, n)))} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={() => {
            add(product.id, qty);
            setAdded(true);
          }}
        >
          {added ? <CheckIcon className="size-4" /> : <CartIcon className="size-4" />}
          {added ? dict.product.addedToCart : dict.product.addToCart}
        </button>
        <button
          type="button"
          className="btn-outline flex-1"
          onClick={() => {
            add(product.id, qty);
            router.push(href("/cart"));
          }}
        >
          {dict.product.buyNow}
        </button>
      </div>
    </div>
  );
}
