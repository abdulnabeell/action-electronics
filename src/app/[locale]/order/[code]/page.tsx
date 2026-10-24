import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/Icons";
import { isLocale, parseLocale } from "@/i18n/config";
import { fmt, getDictionary } from "@/i18n/dictionaries";
import { getCountry } from "@/lib/catalog";
import { whatsappLink } from "@/lib/order-core";

type Props = { params: Promise<{ locale: string; code: string }>; searchParams: Promise<{ demo?: string }> };

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

// Shown after checkout. It only displays the order ID (no personal data) and a fallback WhatsApp link.
export default async function OrderDonePage({ params, searchParams }: Props) {
  const { locale, code } = await params;
  const { demo } = await searchParams;
  if (!isLocale(locale) || !/^[A-Z]{2}-\d{6}-[A-Z0-9]{6}$/.test(code)) notFound();
  const { country, lang } = parseLocale(locale);
  const dict = getDictionary(lang);
  const c = await getCountry(country);

  return (
    <div className="container-x py-12 text-center">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-extrabold">{demo ? dict.cart.demoMode : dict.order.thanks}</h1>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{dict.order.code}</p>
        <p className="text-3xl font-extrabold tracking-wider" dir="ltr">{code}</p>
        <p className="mt-2 text-sm text-slate-600">{dict.order.keep}</p>
        {c.whatsappNumber && (
          <a href={whatsappLink(c.whatsappNumber, fmt(dict.order.whatsappMessage, { code }))} target="_blank" rel="noopener noreferrer" className="btn-wa mt-6 w-full">
            <WhatsAppIcon /> {dict.order.openWhatsapp}
          </a>
        )}
        <Link href={`/${locale}/shop`} className="btn-outline mt-3 w-full">{dict.order.continue}</Link>
      </div>
    </div>
  );
}
