"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const { dict } = useLocale();
  const btn =
    "grid size-11 place-items-center text-lg font-bold transition hover:bg-brand-light disabled:opacity-40";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white" dir="ltr">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${dict.product.quantity} −`}>
        −
      </button>
      <span className="w-10 text-center text-sm font-bold" aria-live="polite" aria-label={dict.product.quantity}>
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`${dict.product.quantity} +`}>
        +
      </button>
    </div>
  );
}
