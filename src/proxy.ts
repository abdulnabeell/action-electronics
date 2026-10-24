import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/i18n/config";
import { ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_MAX_AGE } from "@/lib/admin/cookies";

// 1. Storefront: every path must start with a locale (/uae-en, /uae-ar, /oman-en, /oman-ar). Paths without one
//    are redirected using the saved choice (cookie), then Accept-Language, then the default.
// 2. Admin: silently renews the Supabase session (access token lasts ~1h) from the refresh-token cookie.
//    This is only convenience — every admin page and action re-verifies the user server-side.

async function refreshAdminSession(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-robots-tag", "noindex, nofollow");
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (req.cookies.get(ACCESS_COOKIE)?.value || !refresh || !url || !anon) return res;

  try {
    const r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: anon, "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!r.ok) {
      const out = NextResponse.next();
      out.cookies.delete(REFRESH_COOKIE);
      return out;
    }
    const s = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number };
    req.cookies.set(ACCESS_COOKIE, s.access_token);
    const out = NextResponse.next({ request: req });
    out.headers.set("x-robots-tag", "noindex, nofollow");
    const secure = process.env.NODE_ENV === "production";
    out.cookies.set(ACCESS_COOKIE, s.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, s.expires_in - 30) });
    out.cookies.set(REFRESH_COOKIE, s.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE });
    return out;
  } catch {
    return res;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return refreshAdminSession(req);

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const headers = new Headers(req.headers);
    headers.set("x-locale", first);
    const res = NextResponse.next({ request: { headers } });
    if (req.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const locale = negotiateLocale(req.cookies.get(LOCALE_COOKIE)?.value, req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (images, sitemap.xml, robots.txt, icons…).
  // NOTE: the dot must be written `\\.` — in a normal string `\.` collapses to `.` and the pattern would then exclude
  // every path with at least one character, so the proxy would only ever run for `/`.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
