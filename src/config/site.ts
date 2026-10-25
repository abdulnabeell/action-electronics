// Resolve the canonical origin. Order: NEXT_PUBLIC_SITE_URL, then Vercel's system env vars, then a
// local-development default. Empty/invalid values (e.g. a blank env var on Vercel) are skipped so
// `new URL(site.url)` can never throw during prerendering.
function toOrigin(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin + u.pathname.replace(/\/+$/, "") : null;
  } catch {
    return null;
  }
}

function resolveSiteUrl(): string {
  const configured = toOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;
  const vercel = toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? toOrigin(process.env.VERCEL_URL);
  if (vercel) return vercel;
  return "http://localhost:3000"; // local development only; set NEXT_PUBLIC_SITE_URL for deployments
}

// Brand-level settings shared by every country. Country-specific details (currency, WhatsApp number,
// contact info, delivery) live in src/config/countries.ts and, once the database is live, in Admin → Settings.
export const site = {
  name: "Action Electronics",
  nameAr: "أكشن إلكترونيكس",
  url: resolveSiteUrl(),
  themeColor: "#2563eb",
};
