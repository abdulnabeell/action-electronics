import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryVisual";
import OpenBadge from "@/components/OpenBadge";
import ProductCard from "@/components/ProductCard";
import { ClockIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";
import { isLocale, parseLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { categoryCardImage } from "@/lib/category-image";
import { getStorefront, pick } from "@/lib/catalog";
import { whatsappLink } from "@/lib/order-core";
import { pageMeta } from "@/lib/seo";
import { site } from "@/config/site";
import { notFound } from "next/navigation";
import type { ProductView } from "@/types/catalog";
import { locales as allLocales } from "@/i18n/config";

export const dynamic = "force-static";
export function generateStaticParams() {
  return allLocales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(parseLocale(locale).lang);
  const name = parseLocale(locale).lang === "ar" ? site.nameAr : site.name;
  return { ...pageMeta(locale, "", dict.seo.homeTitle, dict.seo.homeDescription), title: { absolute: `${name} | ${dict.seo.homeTitle}` } };
}

const promoStyles = [
  "from-blue-700 to-sky-500 text-white",
  "from-amber-400 to-orange-500 text-ink",
  "from-slate-800 to-slate-600 text-white",
];

function Row({ title, href, viewAll, products }: { title: string; href: string; viewAll: string; products: ProductView[] }) {
  if (!products.length) return null;
  return (
    <section className="container-x mt-12">
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-brand">{viewAll}</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { lang } = parseLocale(locale);
  const dict = getDictionary(lang);
  const sf = await getStorefront(locale);
  const c = sf.country;
  const base = `/${locale}`;
  const inStock = (p: ProductView) => p.availability === "in_stock" || p.availability === "low_stock";

  const deals = sf.products.filter((p) => p.discountPct && inStock(p)).sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0)).slice(0, 8);
  const preOwned = sf.products.filter((p) => p.condition === "pre_owned" && inStock(p)).slice(0, 4);
  const featured = sf.products.filter((p) => p.featured && inStock(p)).slice(0, 8);
  const newest = [...sf.products].filter((p) => p.condition === "new" && inStock(p)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const hours = c.hours.map((h) => `${pick(h.days, lang)}: ${pick(h.time, lang)}`);
  const address = pick(c.address, lang);

  return (
    <>
      <section className="container-x pt-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-brand-dark via-brand to-blue-500 p-6 text-white sm:p-10 lg:col-span-2">
            <OpenBadge />
            <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">{dict.home.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-base text-blue-100 sm:text-lg">{dict.home.heroSub}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={`${base}/shop`} className="btn bg-white text-brand hover:bg-blue-50">{dict.home.shopNow}</Link>
              <Link href={`${base}/pre-owned`} className="btn border border-white/60 text-white hover:bg-white/10">{dict.home.shopPreOwned}</Link>
              {c.whatsappNumber && (
                <a href={whatsappLink(c.whatsappNumber, dict.contact.greeting)} target="_blank" rel="noopener noreferrer" className="btn-wa">
                  <WhatsAppIcon /> {dict.home.orderWhatsapp}
                </a>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {sf.promotions.slice(0, 3).map((p, i) => (
              <Link
                key={p.id}
                href={p.linkPath ? `${base}${p.linkPath}` : `${base}/shop`}
                className={`relative flex min-h-28 flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br p-5 transition hover:shadow-lg ${promoStyles[i % promoStyles.length]}`}
              >
                {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover opacity-30" />}
                <span className="relative">
                  {p.discountPercent > 0 && <span className="mb-1 inline-block rounded-md bg-white/90 px-2 py-0.5 text-xs font-extrabold text-red-600">{p.discountPercent}%</span>}
                  <span className="block text-lg font-extrabold leading-tight">{p.title}</span>
                  <span className="mt-1 block text-sm opacity-90">{p.subtitle}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x mt-10">
        <h2 className="text-xl font-extrabold sm:text-2xl">{dict.home.shopByCategory}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sf.categories.map((cat) => {
            const items = sf.products.filter((p) => p.category.slug === cat.slug);
            const photo = categoryCardImage(cat, items);
            return (
              <Link key={cat.slug} href={`${base}/category/${cat.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-center transition hover:border-brand hover:shadow">
                <span className="relative block aspect-[4/3] bg-gradient-to-b from-white to-brand-light/40 text-brand/40">
                  {photo ? (
                    <Image src={photo} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw" className="object-contain p-4 transition group-hover:scale-105" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center"><CategoryIcon className="size-1/3" /></span>
                  )}
                </span>
                <span className="block px-2 pb-3 text-sm font-semibold leading-snug">
                  {cat.name}
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">{items.length} {dict.home.items}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Row title={dict.home.deals} href={`${base}/deals`} viewAll={dict.home.viewAll} products={deals} />
      <Row title={dict.home.preOwnedTitle} href={`${base}/pre-owned`} viewAll={dict.home.viewAll} products={preOwned} />

      {sf.brands.length > 0 && (
        <section className="container-x mt-12">
          <h2 className="text-xl font-extrabold sm:text-2xl">{dict.home.brands}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {sf.brands.map((b) => (
              <li key={b.slug}>
                <Link href={`${base}/shop?brand=${b.slug}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold tracking-wide hover:border-brand hover:text-brand">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Row title={dict.home.featured} href={`${base}/shop`} viewAll={dict.home.viewAll} products={featured} />
      <Row title={dict.home.newArrivals} href={`${base}/shop?sort=featured`} viewAll={dict.home.viewAll} products={newest} />

      <section className="container-x mt-12">
        <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3">
          <div className="flex gap-3">
            <PhoneIcon className="mt-1 size-6 shrink-0 text-brand" />
            <div>
              <p className="font-bold">{dict.home.trustWhatsapp}</p>
              <p className="text-sm text-slate-600">{dict.home.trustWhatsappText}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <PinIcon className="mt-1 size-6 shrink-0 text-brand" />
            <div>
              <p className="font-bold">{dict.home.trustDelivery}</p>
              <p className="text-sm text-slate-600">{pick(c.deliveryInfo, lang) || dict.home.trustDeliveryText}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ClockIcon className="mt-1 size-6 shrink-0 text-brand" />
            <div>
              <p className="font-bold">{hours.length ? dict.home.hours : dict.home.trustWarranty}</p>
              {hours.length ? hours.map((h) => <p key={h} className="text-sm text-slate-600">{h}</p>) : <p className="text-sm text-slate-600">{dict.home.trustWarrantyText}</p>}
              {address && <p className="mt-1 text-sm text-slate-600">{address}</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
