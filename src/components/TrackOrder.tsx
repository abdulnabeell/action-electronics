"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney } from "@/lib/pricing";
import type { OrderStatus } from "@/types/catalog";

type Result = { code: string; status: OrderStatus; total: number; currency: string; createdAt: string };

export default function TrackOrder() {
  const { dict, lang } = useLocale();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/orders/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, phone }) });
      if (res.status === 429) setError(dict.account.tooMany);
      else if (!res.ok) setError(dict.account.notFound);
      else setResult(await res.json());
    } catch {
      setError(dict.cart.errServer);
    } finally {
      setBusy(false);
    }
  };

  const decimals = result?.currency === "OMR" ? 3 : 2;
  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="t-code" className="mb-1 block text-sm font-semibold">{dict.account.code}</label>
          <input id="t-code" className="input uppercase" dir="ltr" placeholder="AE-261022-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="t-phone" className="mb-1 block text-sm font-semibold">{dict.account.phone}</label>
          <input id="t-phone" type="tel" className="input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? dict.common.loading : dict.account.track}</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </form>

      {result && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5" role="status">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{dict.order.code}</p>
          <p className="font-extrabold" dir="ltr">{result.code}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">{dict.order.status}</dt>
            <dd className="font-bold">{dict.status[result.status]}</dd>
            <dt className="text-slate-500">{dict.account.placed}</dt>
            <dd>{new Date(result.createdAt).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB")}</dd>
            <dt className="text-slate-500">{dict.account.total}</dt>
            <dd className="font-bold"><bdi>{formatMoney(result.total, result.currency, decimals, lang)}</bdi></dd>
          </dl>
        </div>
      )}
    </div>
  );
}
