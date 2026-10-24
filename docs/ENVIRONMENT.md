# Environment variables

Set these in `.env.local` for local work and in your hosting provider's dashboard for production. `.env*` files are git-ignored; `.env.example` lists the names.

| Variable | Required | Exposed to browser | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes (production) | yes | Canonical origin, e.g. `https://www.example.com`. Used for sitemap, hreflang/canonical and product structured data. No trailing slash. |
| `NEXT_PUBLIC_SUPABASE_URL` | for database mode | yes | Supabase project URL (Settings → API). Also whitelists the Storage host for `next/image`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for database mode | yes | Public `anon` key. Safe in the browser **because** Row Level Security limits it to read-only catalogue data (active products, prices, categories, brands, promotions, countries). |
| `SUPABASE_SERVICE_ROLE_KEY` | for orders + admin | **never** | Bypasses RLS. Used only in server code (`src/lib/supabase/server.ts` is `server-only`): order creation, tracking lookup, admin actions, image upload. Treat as a password; rotate it if it ever leaks. |

Rules of thumb

- A variable is sent to the browser only if it starts with `NEXT_PUBLIC_`. The service-role key must not.
- Without the Supabase variables the storefront shows an “unavailable” page and the build fails: fake products are never served silently. For local development only, set `ALLOW_DEMO_DATA=true` to use the built-in demo catalogue (orders not stored). Never set it in production. With a database connected, rows flagged `is_demo` and promotions with ids starting `demo-` are hidden from customers; delete them in Admin when you no longer need them.
- After changing env vars in production, redeploy (public vars are inlined at build time).

## Supabase settings worth checking

- **Authentication → Providers → Email**: keep email/password enabled; disable public sign-ups (*Allow new users to sign up* off) — staff accounts are created by you in *Users → Add user*, and only users listed in `public.admin_users` can open the dashboard anyway.
- **Authentication → JWT expiry**: the default (1 h) is fine; the app refreshes the session automatically for 7 days.
- **Storage**: the `product-images` bucket is created by the second migration (public read, 4 MB limit, JPEG/PNG/WebP).
