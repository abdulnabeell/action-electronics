"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import Flag from "@/components/Flag";
import { CartIcon, SearchIcon } from "@/components/Icons";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALE_COOKIE, countryCodes, makeLocale, swapLocale, type CountryCode, type Lang } from "@/i18n/config";

function rememberLocale(value: string) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}

export function SearchForm() {
  const { dict, href } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${href("/shop")}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
    >
      <label htmlFor="header-search" className="sr-only">{dict.search.label}</label>
      <input
        id="header-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={dict.search.placeholder}
        className="input !pe-12"
      />
      <button type="submit" aria-label={dict.search.button} className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg bg-brand text-white hover:bg-brand-dark">
        <SearchIcon className="size-4" />
      </button>
    </form>
  );
}

export function CartButton() {
  const { count } = useCart();
  const { dict, href } = useLocale();
  return (
    <Link href={href("/cart")} className="btn-primary relative !px-4" aria-label={`${dict.nav.cart}: ${count}`}>
      <CartIcon className="size-5" />
      <span className="hidden sm:inline">{dict.nav.cart}</span>
      {count > 0 && (
        <span className="absolute -end-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-ink">{count}</span>
      )}
    </Link>
  );
}

export function LocaleSwitchers({ countries }: { countries: { code: CountryCode; name: string }[] }) {
  const { country, lang, dict } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const target = (c: CountryCode, l: Lang) => swapLocale(pathname, makeLocale(c, l));
  const otherLang: Lang = lang === "ar" ? "en" : "ar";
  const current = countries.find((c) => c.code === country);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative" ref={box}>
        <button
          type="button"
          className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold hover:border-brand"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${dict.nav.country}: ${current?.name ?? ""}`}
          onClick={() => setOpen((o) => !o)}
        >
          <Flag code={country} />
          <span className="hidden sm:inline">{current?.name}</span>
          <span aria-hidden="true" className="text-[10px] text-slate-500">▾</span>
        </button>
        {open && (
          <ul role="listbox" aria-label={dict.nav.country} className="absolute end-0 z-50 mt-1 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {countries.map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === country}>
                <Link
                  href={target(c.code, lang)}
                  onClick={() => {
                    rememberLocale(makeLocale(c.code, lang));
                    setOpen(false);
                  }}
                  className={`flex min-h-11 items-center gap-2.5 px-3 text-sm hover:bg-brand-light ${c.code === country ? "font-bold text-brand" : ""}`}
                >
                  <Flag code={c.code} /> {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        href={target(country, otherLang)}
        hrefLang={otherLang}
        lang={otherLang}
        onClick={() => rememberLocale(makeLocale(country, otherLang))}
        className="grid min-h-10 place-items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold hover:border-brand"
        aria-label={`${dict.nav.language}: ${dict.nav.switchLanguage}`}
      >
        {dict.nav.switchLanguage}
      </Link>
    </div>
  );
}

export function PrimaryNavLink({ path, children, exact = false }: { path: string; children: React.ReactNode; exact?: boolean }) {
  const { href } = useLocale();
  const pathname = usePathname();
  const to = href(path);
  const active = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link href={to} aria-current={active ? "page" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-brand-light ${active ? "text-brand" : "text-slate-700"}`}>
      {children}
    </Link>
  );
}

export { countryCodes };
