import Link from "next/link";
import { getLocaleFromHeaders } from "@/lib/locale-server";

export default async function NotFound() {
  const { locale, dict } = await getLocaleFromHeaders();
  return (
    <div className="container-x py-20 text-center">
      <h1 className="text-3xl font-extrabold">{dict.errors.notFoundTitle}</h1>
      <p className="mt-2 text-slate-600">{dict.errors.notFoundText}</p>
      <Link href={`/${locale}`} className="btn-primary mt-6">{dict.errors.goHome}</Link>
    </div>
  );
}
