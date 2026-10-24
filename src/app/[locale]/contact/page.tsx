import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OpenBadge from "@/components/OpenBadge";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";
import { site } from "@/config/site";
import { fmt, getDictionary } from "@/i18n/dictionaries";
import { isLocale, parseLocale } from "@/i18n/config";
import { getCountry, pick } from "@/lib/catalog";
import { whatsappLink } from "@/lib/order-core";
import { pageMeta } from "@/lib/seo";
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
  return pageMeta(locale, "/contact", dict.contact.title, dict.seo.contactDescription);
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { country, lang } = parseLocale(locale);
  const dict = getDictionary(lang);
  const c = await getCountry(country);
  const address = pick(c.address, lang);

  const rows = [
    address && { icon: <PinIcon className="size-5" />, label: dict.contact.address, value: address, href: c.mapsLink || undefined },
    c.phone && { icon: <PhoneIcon className="size-5" />, label: dict.contact.phone, value: c.phoneDisplay || c.phone, href: `tel:${c.phone}`, ltr: true },
    c.whatsappNumber && { icon: <WhatsAppIcon className="size-5" />, label: dict.contact.whatsapp, value: `+${c.whatsappNumber}`, href: whatsappLink(c.whatsappNumber, dict.contact.greeting), ltr: true },
    c.email && { icon: <MailIcon className="size-5" />, label: dict.contact.email, value: c.email, href: `mailto:${c.email}`, ltr: true },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href?: string; ltr?: boolean }[];

  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{dict.contact.title}</h1>
      <p className="mt-1 text-slate-600">{lang === "ar" ? site.nameAr : site.name} — {pick(c.name, lang)}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          {c.whatsappNumber && (
            <a href={whatsappLink(c.whatsappNumber, dict.contact.greeting)} target="_blank" rel="noopener noreferrer" className="btn-wa w-full !min-h-12 text-base">
              <WhatsAppIcon /> {dict.contact.chat}
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className="btn-outline w-full !min-h-12 text-base">
              <PhoneIcon /> {fmt(dict.contact.call, { number: "" })}<bdi dir="ltr">{c.phoneDisplay || c.phone}</bdi>
            </a>
          )}
          {rows.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-slate-600">{dict.contact.tbc}</p>}

          <ul className="space-y-3 pt-2">
            {rows.map((r) => (
              <li key={r.label} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="mt-0.5 text-brand">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{r.label}</p>
                  {r.href ? (
                    <a href={r.href} dir={r.ltr ? "ltr" : undefined} className="break-words font-semibold hover:text-brand" {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{r.value}</a>
                  ) : (
                    <p className="font-semibold">{r.value}</p>
                  )}
                </div>
              </li>
            ))}
            {c.hours.length > 0 && (
              <li className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="mt-0.5 text-brand"><ClockIcon className="size-5" /></span>
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{dict.contact.hours} <OpenBadge /></p>
                  {c.hours.map((h, i) => <p key={i} className="font-semibold">{pick(h.days, lang)}: <span className="font-normal">{pick(h.time, lang)}</span></p>)}
                </div>
              </li>
            )}
            {(c.deliveryInfo.en || c.deliveryInfo.ar) && (
              <li className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{dict.contact.delivery}</p>
                <p className="mt-1 text-sm text-slate-700">{pick(c.deliveryInfo, lang)}</p>
              </li>
            )}
          </ul>
        </div>

        {c.mapsEmbed && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <iframe title={dict.contact.map} src={c.mapsEmbed} loading="lazy" className="h-80 w-full border-0 md:h-[26rem]" referrerPolicy="no-referrer-when-downgrade" />
            {c.mapsLink && (
              <a href={c.mapsLink} target="_blank" rel="noopener noreferrer" className="btn-primary m-4"><PinIcon /> {dict.contact.directions}</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
