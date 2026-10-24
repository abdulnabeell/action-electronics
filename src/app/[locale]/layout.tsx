import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/CartProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { LocaleProvider, type CountryInfo } from "@/components/LocaleProvider";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { site } from "@/config/site";
import { dirOf, isLocale, locales, parseLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCountry, pick } from "@/lib/catalog";
import { alternates } from "@/lib/seo";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic", "latin"], variable: "--font-arabic", display: "swap" });

// Pages are statically generated per locale and revalidated; admin edits trigger on-demand revalidation.
export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: site.themeColor };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { lang } = parseLocale(locale);
  const dict = getDictionary(lang);
  const name = lang === "ar" ? site.nameAr : site.name;
  return {
    metadataBase: new URL(site.url),
    title: { default: `${name} | ${dict.seo.homeTitle}`, template: `%s | ${name}` },
    description: dict.seo.homeDescription,
    alternates: alternates(locale),
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { country, lang } = parseLocale(locale);
  const dict = getDictionary(lang);
  const c = await getCountry(country);

  const info: CountryInfo = {
    code: c.code,
    name: pick(c.name, lang),
    currency: c.currency,
    currencyDecimals: c.currencyDecimals,
    whatsappNumber: c.whatsappNumber,
    phone: c.phone,
    phoneDisplay: c.phoneDisplay,
    freeDeliveryOver: c.freeDeliveryOver,
    deliveryFee: c.deliveryFee,
    deliveryInfo: pick(c.deliveryInfo, lang),
    address: pick(c.address, lang),
    email: c.email,
    timeZone: c.timeZone,
    openDays: c.openDays,
    openHour: c.openHour,
    closeHour: c.closeHour,
    regions: c.regions.map((r) => ({ value: r.en, label: pick(r, lang) })),
  };

  return (
    <html lang={lang} dir={dirOf(lang)} className={`${jakarta.variable} ${arabic.variable}`}>
      <body className="font-sans antialiased">
        <LocaleProvider locale={locale} dict={dict} info={info}>
          <CartProvider>
            <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
              {dict.common.skip}
            </a>
            <Header locale={locale} dict={dict} />
            <main id="content">{children}</main>
            <Footer locale={locale} dict={dict} />
            <WhatsAppFloat />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
