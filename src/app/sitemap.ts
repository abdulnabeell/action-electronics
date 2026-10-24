import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { locales, parseLocale } from "@/i18n/config";
import { getAllProductSlugs, getCategoryTree } from "@/lib/catalog";

// One entry per locale and page, each carrying hreflang alternates for the other locales.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats] = await Promise.all([getAllProductSlugs(), getCategoryTree("en")]);
  const paths = ["", "/shop", "/pre-owned", "/deals", "/contact", ...cats.map((c) => `/category/${c.slug}`)];
  const hreflang = (l: (typeof locales)[number]) => `${parseLocale(l).lang}-${parseLocale(l).country === "uae" ? "AE" : "OM"}`;
  const alts = (path: string, only?: string[]) => ({
    languages: Object.fromEntries(
      locales.filter((l) => !only || only.includes(parseLocale(l).country)).map((l) => [hreflang(l), `${site.url}/${l}${path}`]),
    ),
  });

  const out: MetadataRoute.Sitemap = [];
  for (const l of locales) {
    for (const p of paths) out.push({ url: `${site.url}/${l}${p}`, changeFrequency: "daily", priority: p === "" ? 1 : 0.7, alternates: alts(p) });
  }
  for (const pr of products) {
    const path = `/product/${pr.slug}`;
    for (const l of locales) {
      if (!pr.countries.includes(parseLocale(l).country)) continue; // only list a product where it is sold
      out.push({ url: `${site.url}/${l}${path}`, lastModified: pr.createdAt, changeFrequency: "weekly", priority: 0.6, alternates: alts(path, pr.countries) });
    }
  }
  return out;
}
