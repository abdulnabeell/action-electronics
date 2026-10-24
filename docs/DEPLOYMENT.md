# Deployment

The app is a standard Next.js 16 server (it uses route handlers, server actions and a proxy), so deploy it to a Node-capable host — Vercel, or any container/VM host running `npm run build && npm start`. A static export is **not** possible.

## 1. Database (Supabase)

1. Create a project (choose a region near your customers — e.g. Middle East if available).
2. Run the SQL files in order (SQL editor, or `supabase db push` if you use the CLI):
   1. `supabase/migrations/20261022000000_init.sql` — tables, RLS policies, `create_order` / `set_order_status` functions, reporting views.
   2. `supabase/migrations/20261022000100_storage.sql` — `product-images` bucket.
   3. `supabase/migrations/20261022000200_category_hierarchy.sql` — adds `categories.active`, applies the approved category tree (additive; hides retired categories, deletes nothing).
   4. `supabase/seed.sql` — countries, categories, brands and **demo** products/promotions (skip this if you will enter real data by hand; the countries rows are still required — run just the `-- countries` and `-- categories` sections).
3. Create staff users (Authentication → Users → *Add user*) and register them:
   ```sql
   insert into public.admin_users (user_id, email, role)
   select id, email, 'admin' from auth.users where email = 'owner@example.com';
   ```
4. Turn off public sign-ups (see `docs/ENVIRONMENT.md`).

## 2. Hosting

Set the four environment variables from `docs/ENVIRONMENT.md`, then:

```bash
npm ci
npm run build
npm start          # Vercel does this for you
```

- **Domain / HTTPS**: serve over HTTPS (admin cookies are `Secure` in production). Set `NEXT_PUBLIC_SITE_URL` to the final origin.
- **Caching**: storefront pages are statically generated per locale and revalidated every 5 minutes; saving anything in Admin triggers an immediate revalidation. New products/categories created after a build are rendered on first request.
- **Region**: put the app in the same region as the Supabase project to keep page generation and order creation fast.

## 3. After the first deploy

- [ ] Open `/admin`, sign in, set the **Oman WhatsApp number** (Admin → Countries & contact) — Oman checkout stays disabled until it is set.
- [ ] Place a test order in each country; confirm the row appears in Admin → Orders and the WhatsApp message arrives on the right number.
- [ ] Change its status to *Confirmed* and check stock dropped; set it to *Cancelled* and check stock was restored.
- [ ] Submit `https://<domain>/sitemap.xml` in Google Search Console.
- [ ] Replace all demo data (checklist in README) and remove `public/products/*.jpg` + `CREDITS.md` once unused.

## 4. Hardening you may want

- The built-in rate limiter (orders, order tracking, admin login) is per server instance. For multi-instance or high-traffic deployments add a platform/WAF rate limit on `/api/orders`, `/api/orders/track` and `/admin/login`.
- Add a Content-Security-Policy at the host/CDN if your policy requires it (the Google Maps embed on the contact page needs `frame-src https://maps.google.com`).
- Enable Supabase backups (Pro plan: daily backups / PITR) — orders are the only data that cannot be regenerated.
- Back up `SUPABASE_SERVICE_ROLE_KEY` in a password manager; rotate it from Supabase if it is ever exposed.

## Operational notes

- **Stock** is deducted once when an order moves from *Pending* to *Confirmed/Processing/Shipped/Completed*, and restored if it goes back to *Pending* or to *Cancelled*. Pending orders don't reserve stock.
- **Sales totals** on the dashboard count Confirmed → Completed orders, per currency. AED and OMR are never added together.
- **Deleting a product** keeps past orders intact (order items store a snapshot of name, SKU and price).
