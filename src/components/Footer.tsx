import Link from "next/link";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";
import { site } from "@/config/site";
import { parseLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getStorefront, pick } from "@/lib/catalog";
import { whatsappLink } from "@/lib/order-core";

export default async function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lang } = parseLocale(locale);
  const sf = await getStorefront(locale);
  const c = sf.country;
  const base = `/${locale}`;
  const address = pick(c.address, lang);

  return (
    <footer className="mt-16 bg-ink pb-24 text-slate-300 sm:pb-0">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold text-white">{lang === "ar" ? site.nameAr : site.name}</p>
          <p className="mt-2 text-sm">{dict.home.heroSub}</p>
          {c.whatsappNumber && (
            <a href={whatsappLink(c.whatsappNumber, dict.contact.greeting)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-4">
              <WhatsAppIcon /> {dict.footer.chat}
            </a>
          )}
        </div>
        <div>
          <p className="font-bold text-white">{dict.nav.categories}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {sf.categories.map((cat) => (
              <li key={cat.slug}><Link href={`${base}/category/${cat.slug}`} className="hover:text-white">{cat.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-white">{dict.footer.explore}</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li><Link href={`${base}/shop`} className="hover:text-white">{dict.footer.shopAll}</Link></li>
            <li><Link href={`${base}/pre-owned`} className="hover:text-white">{dict.nav.preOwned}</Link></li>
            <li><Link href={`${base}/deals`} className="hover:text-white">{dict.nav.deals}</Link></li>
            <li><Link href={`${base}/account`} className="hover:text-white">{dict.nav.account}</Link></li>
            <li><Link href={`${base}/cart`} className="hover:text-white">{dict.nav.cart}</Link></li>
            <li><Link href={`${base}/contact`} className="hover:text-white">{dict.footer.contact}</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-white">{dict.footer.contactUs} — {pick(c.name, lang)}</p>
          {address ? (
            <p className="flex gap-2"><PinIcon className="mt-0.5 size-4 shrink-0" />{address}</p>
          ) : null}
          {c.phone ? (
            <p className="flex gap-2"><PhoneIcon className="mt-0.5 size-4 shrink-0" /><a href={`tel:${c.phone}`} dir="ltr" className="hover:text-white">{c.phoneDisplay || c.phone}</a></p>
          ) : null}
          {c.email ? (
            <p className="flex gap-2"><MailIcon className="mt-0.5 size-4 shrink-0" /><a href={`mailto:${c.email}`} className="break-all hover:text-white">{c.email}</a></p>
          ) : null}
          {!address && !c.phone && !c.email && <p>{dict.contact.tbc}</p>}
          {c.hours.map((h, i) => (
            <p key={i} className="ps-6">{pick(h.days, lang)}: {pick(h.time, lang)}</p>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        {sf.hasDemo && <p className="mb-1">{dict.footer.demoNote}</p>}
        © {new Date().getFullYear()} {lang === "ar" ? site.nameAr : site.name}. {dict.footer.rights}
      </div>
    </footer>
  );
}
