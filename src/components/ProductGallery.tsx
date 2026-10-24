"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import ProductImage from "@/components/ProductImage";
import { fmt } from "@/i18n/dictionaries";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const { dict } = useLocale();
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <ProductImage src={images[i]} alt={name} priority sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto" aria-label={dict.product.gallery}>
          {images.map((src, n) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={fmt(dict.product.image, { n: n + 1 })}
                aria-current={n === i}
                className={`relative block size-16 overflow-hidden rounded-xl border bg-white sm:size-20 ${n === i ? "border-brand ring-2 ring-brand/30" : "border-slate-200"}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
