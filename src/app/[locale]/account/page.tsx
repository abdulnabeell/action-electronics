import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackOrder from "@/components/TrackOrder";
import { isLocale, parseLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { locales as allLocales } from "@/i18n/config";

export const dynamic = "force-static";
export function generateStaticParams() {
  return allLocales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(parseLocale(locale).lang).account.title, robots: { index: false } };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(parseLocale(locale).lang);
  return (
    <div className="container-x py-8">
      <h1 className="text-center text-2xl font-extrabold sm:text-3xl">{dict.account.title}</h1>
      <p className="mx-auto mt-2 max-w-md text-center text-slate-600">{dict.account.intro}</p>
      <div className="mt-6"><TrackOrder /></div>
    </div>
  );
}
