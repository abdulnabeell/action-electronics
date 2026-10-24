"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useLocale();
  return (
    <div className="container-x py-20 text-center" role="alert">
      <h1 className="text-3xl font-extrabold">{dict.errors.errorTitle}</h1>
      <p className="mt-2 text-slate-600">{dict.errors.errorText}</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">{dict.common.retry}</button>
    </div>
  );
}
