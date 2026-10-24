import Image from "next/image";
import Link from "next/link";
import { CartButton, LocaleSwitchers, PrimaryNavLink, SearchForm } from "@/components/HeaderClient";
import { UserIcon } from "@/components/Icons";
import type { Locale } from "@/i18n/config";
import { parseLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getEnabledCountries, getStorefront, pick } from "@/lib/catalog";
import { site } from "@/config/site";

export default async function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lang } = parseLocale(locale);
  const [sf, countries] = await Promise.all([getStorefront(locale), getEnabledCountries()]);
  const base = `/${locale}`;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-ink text-xs text-white">
        <div className="container-x flex min-h-8 flex-wrap items-center justify-center gap-x-4 py-1 text-center">
          <span>{dict.announce.welcome}</span>
          {sf.hasDemo && <span className="rounded bg-accent px-2 py-0.5 font-semibold text-ink">{dict.announce.demo}</span>}
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="container-x flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 lg:flex-nowrap">
          <Link href={base} className="order-1 flex items-center gap-2.5" aria-label={`${lang === "ar" ? site.nameAr : site.name}`}>
            <Image src="/logo.png" alt="" width={40} height={40} className="size-10 rounded-lg" priority />
            <span className="hidden text-base font-extrabold leading-tight sm:block">{lang === "ar" ? site.nameAr : site.name}</span>
          </Link>
          <div className="order-3 w-full lg:order-2 lg:w-auto lg:flex-1">
            <SearchForm />
          </div>
          <div className="order-2 ms-auto flex items-center gap-2 lg:order-3">
            <LocaleSwitchers countries={countries.map((c) => ({ code: c.code, name: pick(c.name, lang) }))} />
            <Link href={`${base}/account`} className="grid size-10 place-items-center rounded-lg border border-slate-300 hover:border-brand hover:text-brand" aria-label={dict.nav.account} title={dict.nav.account}>
              <UserIcon className="size-5" />
            </Link>
            <CartButton />
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-200 bg-white" aria-label={dict.nav.categories}>
        <div className="container-x flex gap-1 overflow-x-auto py-1">
          <PrimaryNavLink path="" exact>{dict.nav.home}</PrimaryNavLink>
          <PrimaryNavLink path="/shop" exact>{dict.nav.shop}</PrimaryNavLink>
          <PrimaryNavLink path="/pre-owned">{dict.nav.preOwned}</PrimaryNavLink>
          <PrimaryNavLink path="/deals">{dict.nav.deals}</PrimaryNavLink>
          <span className="mx-1 my-2 w-px shrink-0 bg-slate-200" aria-hidden="true" />
          {sf.categories.map((c) => (
            <PrimaryNavLink key={c.slug} path={`/category/${c.slug}`}>{c.name}</PrimaryNavLink>
          ))}
          <PrimaryNavLink path="/contact">{dict.nav.contact}</PrimaryNavLink>
        </div>
      </nav>
    </header>
  );
}
