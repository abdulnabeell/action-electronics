# Action Electronics storefront

Bilingual (English / Arabic, RTL) electronics store for the **UAE (AED)** and **Oman (OMR)** with **WhatsApp checkout**, a staff **admin dashboard**, and a Supabase (PostgreSQL + Storage) backend.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · `@supabase/supabase-js` (the only added dependency).

## How it works

| Area | What it does |
| --- | --- |
| **URLs** | `/<country>-<lang>/…` — `/uae-en`, `/uae-ar`, `/oman-en`, `/oman-ar`. `/` redirects using the saved choice (cookie `ae_locale`), then `Accept-Language`. Each page has canonical + hreflang metadata, and `sitemap.xml` lists every locale. |
| **Countries** | Each country has its own currency (AED 2 decimals, OMR 3), WhatsApp number, contact details, delivery info and region list. **Prices are stored per country — nothing is converted automatically.** A product with no price row for a country is not sold there. |
| **Languages** | Dictionaries in `src/i18n/dictionaries/{en,ar}.ts` (a test fails if keys differ). Arabic uses `dir="rtl"`, Noto Sans Arabic and logical Tailwind classes (`ps-`, `end-`, `text-start`). |
| **Catalogue** | 6 main categories with up to three levels (e.g. Mobile & Tablets › Mobile Phones › iPhones; hierarchy in `src/data/category-tree.ts`), New / Pre-Owned condition, brands, regional price/compare-at/stock/availability, promotions. Discounts come from a product's compare-at price and/or a promotion percentage (best one wins, never stacked). |
| **Checkout** | Cart (ids + quantities only in the browser) → customer details → `POST /api/orders`. The server **re-prices everything from the database**, creates an order ID (`AE-261022-K7M2PX`), **stores the order, then** returns the WhatsApp link with the full order message. Statuses: Pending → Confirmed → Processing → Shipped → Completed / Cancelled. No payment gateway. |
| **Admin** | `/admin` — products (+image upload), inventory, categories, brands, promotions, orders (search/filter/status), dashboard (counts, sales per currency, best sellers), country settings & WhatsApp numbers. |
| **Demo mode** | Off by default. Set `ALLOW_DEMO_DATA=true` (local development only) to run on `src/data/seed.ts` (36 clearly-labelled **demo** products) without a database; orders are then not stored. Without it, missing Supabase settings show an “unavailable” page, and products/brands/promotions flagged demo in the database are hidden from the storefront. |

## Quick start (demo mode — no database needed)

```bash
npm install
npm run dev          # http://localhost:3000
```

Everything on the storefront works, including country/language switching, cart and the WhatsApp message. **Oman checkout is disabled until an Oman WhatsApp number is configured** (none was supplied; nothing is invented) — set it in Admin → *Countries & contact*, or in `src/config/countries.ts` for demo mode.

## Go live with Supabase

1. Create a Supabase project.
2. SQL editor → run, in order: `supabase/migrations/20261022000000_init.sql`, `supabase/migrations/20261022000100_storage.sql`, then `supabase/seed.sql` (demo data; regenerate with `npm run seed:sql`).
3. Copy `.env.example` to `.env.local` and fill in the three Supabase values (see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)).
4. Authentication → Users → **Add user** (email + password) for each staff member, then in the SQL editor:
   ```sql
   insert into public.admin_users (user_id, email, role)
   select id, email, 'admin' from auth.users where email = 'owner@example.com';
   -- role 'staff' = orders only
   ```
5. Open `/admin`, sign in, then **Countries & contact** → set the Oman WhatsApp number and any delivery fees.
6. Replace demo data (checklist below), then deploy — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Replace demo data before launch

- [ ] Delete or replace all products flagged **Demo** (Admin → Products). Demo images in `public/products/` are third-party photos listed in `public/products/CREDITS.md`; upload your own via Admin and delete those files.
- [ ] Delete the demo brands and the “Demo offer” promotion; add real promotions.
- [ ] Enter real prices for **each** country (AED and OMR separately), stock, warranty text and Arabic translations.
- [ ] Confirm the UAE contact details in Admin → *Countries & contact*; add the Oman ones.
- [ ] Remove `public/products/*.jpg` and `CREDITS.md` once no product references them.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm start            # run the production build
npm run typecheck    # tsc --noEmit (npm run lint is the same)
npm test             # unit tests (pricing, totals, order codes, WhatsApp message, validation, i18n parity, seed)
node tests/e2e.mjs   # browser end-to-end check against a running server (needs Chrome/Edge)
npm run seed:sql     # regenerate supabase/seed.sql from src/data/seed.ts
```

## Project layout

```
src/app/[locale]/…        storefront pages (home, shop, category, pre-owned, deals, product, cart, contact, account, order)
src/app/admin/…           staff dashboard (separate root layout, English UI)
src/app/api/…             cart pricing, orders, order tracking, admin image upload
src/proxy.ts              locale redirect + admin session refresh
src/lib/catalog.ts        catalogue reads (Supabase, or demo seed) → localized ProductView per country
src/lib/pricing.ts        regional price, promotion and discount maths (pure)
src/lib/order-core.ts     order code, totals, WhatsApp message (pure)
src/lib/orders.ts         server-side order creation
src/lib/admin/…           auth, queries, server actions
src/config/countries.ts   per-country defaults (fallback + seed)
supabase/                 migrations + seed
docs/                     environment, deployment, testing
```

Images: product photos are served by `next/image` (AVIF/WebP, responsive sizes, lazy-loaded). Admin uploads go to the public `product-images` bucket (JPEG/PNG/WebP, max 4 MB, type verified from file bytes).
