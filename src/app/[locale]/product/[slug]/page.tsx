import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/Icons";
import Price, { DiscountBadge } from "@/components/Price";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import { isLocale, locales, makeLocale, parseLocale } from "@/i18n/config";
import { fmt, getDictionary } from "@/i18n/dictionaries";
import { getAllProductSlugs, getProductView, getStorefront } from "@/lib/catalog";
import { whatsappLink } from "@/lib/order-core";
import { pageMeta } from "@/lib/seo";
import { site } from "@/config/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-static";
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return locales.flatMap((locale) => slugs.map((s) => ({ locale, slug: s.slug })));
}

// Products created in Admin after the build are rendered on demand and then cached.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = await getProductView(locale, slug);
  if (!p) return {};
  return pageMeta(locale, `/product/${slug}`, p.name, p.description, p.images[0]);
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const { lang, country } = parseLocale(locale);
  const dict = getDictionary(lang);
  const product = await getProductView(locale, slug);
  if (!product) notFound();

  const sf = await getStorefront(locale);
  const base = `/${locale}`;
  const c = sf.country;
  const unavailable = product.availability === "unavailable";
  const related = sf.products.filter((p) => p.category.slug === product.category.slug && p.id !== product.id).slice(0, 4);
  const ask = c.whatsappNumber ? whatsappLink(c.whatsappNumber, fmt(dict.product.askMessage, { name: product.name, sku: product.sku })) : null;
  const otherCountry = country === "uae" ? "oman" : "uae";

  const jsonLd = unavailable
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        sku: product.sku,
        description: product.description,
        image: product.images.map((i) => (i.startsWith("http") ? i : `${site.url}${i}`)),
        brand: { "@type": "Brand", name: product.brand.name },
        itemCondition: product.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        offers: {
          "@type": "Offer",
          url: `${site.url}${base}/product/${product.slug}`,
          priceCurrency: c.currency,
          price: product.price,
          availability: product.availability === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        },
      };

  return (
    <div className="container-x py-6">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <nav className="text-sm text-slate-500" aria-label={dict.product.breadcrumb}>
        <Link href={`${base}/shop`} className="hover:text-brand">{dict.nav.shop}</Link> /{" "}
        {product.categoryPath.length ? (
          product.categoryPath.map((c, i) => (
            <span key={c.slug}>{i > 0 && " / "}<Link href={`${base}/category/${c.slug}`} className="hover:text-brand">{c.name}</Link></span>
          ))
        ) : (
          <span>{product.category.name}</span>
        )}
      </nav>

      <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">{product.brand.name} · {product.category.name}</p>
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${product.condition === "pre_owned" ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"}`}>
              {dict.condition[product.condition]}
              {product.grade && ` · ${dict.condition.grade} ${product.grade}`}
            </span>
            <DiscountBadge pct={product.discountPct} />
          </div>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{dict.product.sku}: <bdi>{product.sku}</bdi></p>

          {unavailable ? (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900" role="status">
              <p className="font-semibold">{dict.product.unavailable}</p>
              <Link href={`/${makeLocale(otherCountry, lang)}/product/${product.slug}`} className="mt-1 inline-block font-semibold underline">
                {(otherCountry === "oman" ? "Oman" : "UAE")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-3"><Price price={product.price} compareAt={product.compareAt} size="lg" /></div>
              <p className={`mt-1 text-sm font-semibold ${product.availability === "out_of_stock" ? "text-slate-500" : product.availability === "low_stock" ? "text-amber-700" : "text-green-700"}`}>
                {product.availability === "out_of_stock" ? dict.product.outOfStock : product.availability === "low_stock" ? fmt(dict.product.lowStock, { n: product.stock }) : dict.product.inStock}
              </p>
            </>
          )}
          {product.isDemo && <p className="mt-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-ink">{dict.product.demoNote}</p>}

          <p className="mt-4 text-slate-700">{product.description}</p>

          {product.specs.length > 0 && (
            <section className="mt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{dict.product.specs}</h2>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                {product.specs.map((s) => <li key={s} className="px-3 py-2">{s}</li>)}
              </ul>
            </section>
          )}

          <section className="mt-5 rounded-xl bg-slate-50 p-3 text-sm">
            <p><span className="font-bold">{dict.product.warranty}:</span> {product.warranty || dict.product.noWarranty}</p>
            {c.deliveryInfo.en && <p className="mt-1 text-slate-600"><span className="font-bold">{dict.cart.deliveryInfo}:</span> {lang === "ar" && c.deliveryInfo.ar ? c.deliveryInfo.ar : c.deliveryInfo.en}</p>}
          </section>

          <div className="mt-6">
            <ProductActions product={product} />
            {ask && (
              <a href={ask} target="_blank" rel="noopener noreferrer" className="btn-wa mt-3 w-full">
                <WhatsAppIcon /> {dict.product.ask}
              </a>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold">{dict.product.related}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
