"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { CartIcon, CheckIcon } from "@/components/Icons";
import { useLocale } from "@/components/LocaleProvider";
import type { ProductView } from "@/types/catalog";

export default function AddToCart({
  product,
  className = "btn-primary w-full",
}: {
  product: Pick<ProductView, "id" | "availability">;
  className?: string;
}) {
  const { add } = useCart();
  const { dict } = useLocale();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  if (product.availability === "out_of_stock" || product.availability === "unavailable") {
    return (
      <button className={className} disabled>
        {product.availability === "unavailable" ? dict.product.unavailable : dict.product.outOfStock}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add(product.id);
        setAdded(true);
      }}
    >
      {added ? <CheckIcon className="size-4" /> : <CartIcon className="size-4" />}
      <span aria-live="polite">{added ? dict.product.added : dict.product.addToCart}</span>
    </button>
  );
}
