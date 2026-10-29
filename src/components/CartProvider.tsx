"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { MAX_QTY } from "@/lib/validators";

const KEY = "action-electronics-cart-v2";

/** A cart line as priced by the server for the current country. */
export type CartLine = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  image: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  qty: number;
};

type Stored = Record<string, number>; // product id -> qty

type CartCtx = {
  lines: CartLine[];
  /** Total quantity in the cart (shown on the header badge). */
  count: number;
  ready: boolean;
  /** True when the last attempt to price the cart on the server failed (items are still stored). */
  error: boolean;
  retry: () => void;
  /** Number of stored products that aren't sold in the current country. */
  unavailable: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const [items, setItems] = useState<Stored>({});
  const [loaded, setLoaded] = useState(false);
  const [priced, setPriced] = useState<Omit<CartLine, "qty">[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const read = (raw: string | null): Stored => {
    const out: Stored = {};
    try {
      const o = raw ? JSON.parse(raw) : {};
      for (const [id, q] of Object.entries(o)) if (typeof q === "number" && q > 0) out[id] = Math.min(MAX_QTY, Math.floor(q));
    } catch {}
    return out;
  };

  useEffect(() => {
    let stored: Stored = {};
    try {
      stored = read(localStorage.getItem(KEY));
    } catch {}
    // Merge (don't overwrite) so an add that happened before this effect ran is never lost.
    setItems((s) => ({ ...stored, ...s }));
    setLoaded(true);
    // Keep several tabs of the same browser on one cart.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  // Re-price the cart on the server whenever the set of products or the country/language changes.
  const idsKey = Object.keys(items).sort().join("|");
  const lastKey = useRef("");
  useEffect(() => {
    if (!loaded) return;
    const key = `${locale}::${idsKey}::${attempt}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (!idsKey) {
      setPriced([]);
      setMissing([]);
      setError(false);
      setReady(true);
      return;
    }
    const ctrl = new AbortController();
    setError(false);
    fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale, ids: idsKey.split("|") }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { items: Omit<CartLine, "qty">[]; missing: string[] }) => {
        setPriced(d.items);
        setMissing(d.missing);
        setReady(true);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(true);
        setReady(true);
      });
    return () => {
      ctrl.abort();
      lastKey.current = ""; // an aborted request must not block the next run for the same key
    };
  }, [loaded, locale, idsKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const add = useCallback(
    (id: string, qty = 1) => setItems((s) => ({ ...s, [id]: Math.min(MAX_QTY, (s[id] ?? 0) + qty) })),
    [],
  );
  const setQty = useCallback(
    (id: string, qty: number) =>
      setItems((s) => {
        const next = { ...s };
        if (qty <= 0) delete next[id];
        else next[id] = Math.min(MAX_QTY, qty);
        return next;
      }),
    [],
  );
  const remove = useCallback(
    (id: string) =>
      setItems((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      }),
    [],
  );
  const clear = useCallback(() => setItems({}), []);

  const value = useMemo<CartCtx>(() => {
    const lines: CartLine[] = [];
    for (const p of priced) {
      const qty = items[p.id];
      if (!qty || p.stock <= 0) continue;
      lines.push({ ...p, qty: Math.min(qty, p.stock, MAX_QTY) });
    }
    return {
      lines,
      count: Object.values(items).reduce((n, q) => n + q, 0),
      ready,
      error,
      retry,
      unavailable: missing.filter((id) => items[id]).length,
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, priced, missing, ready, error, retry, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
