# Testing

## Automated

| Command | Covers |
| --- | --- |
| `npm run typecheck` | TypeScript across the whole project. |
| `npm test` | Pure logic with Node's built-in runner: regional pricing/rounding (AED 2 dp, OMR 3 dp), promotions (best discount, no stacking, date/country scope), availability, cart totals and delivery rules, order-ID format, WhatsApp message content (EN + AR), customer/order validation, locale helpers, **EN/AR dictionary key parity**, demo-seed integrity (6 categories × ≥5 products, separate regional prices, valid references). |
| `node tests/e2e.mjs [baseUrl]` | Real browser (Chrome/Edge via DevTools Protocol) against a running server: country switch (AED→OMR, product unavailable in Oman), language switch + Arabic `dir="rtl"`, saved locale cookie, add to cart, quantity +/−, totals, checkout validation, order creation and the WhatsApp URL (order ID, total, customer details), search and pre-owned filtering. |

Run `npm run build` too — it type-checks and prerenders all 261+ localized pages.

## Database checks (done once, against a real Postgres engine)

The migrations and `seed.sql` were executed on PostgreSQL (PGlite) with stand-ins for Supabase's `anon`/`authenticated`/`service_role` roles, and verified:

- migrations + seed apply cleanly; the seed is idempotent (re-running changes nothing);
- `anon` can read products but cannot read orders, call `create_order`, or insert products;
- `create_order` writes the order and items atomically; a duplicate order code raises `23505` (the app retries with a new code);
- `set_order_status` deducts stock once, never twice, and restores it on cancel;
- reporting views return correct counts/units/revenue and are not readable by `anon`;
- slug and WhatsApp-number check constraints reject bad input.

## Manual checklist after connecting Supabase

The admin dashboard and the database-backed order path talk to Supabase over its REST API, so verify them once with real credentials:

1. `/admin` → sign in with a staff user → dashboard loads (empty counts are fine).
2. Products → **Add product**: upload an image, set UAE + Oman prices, save → it appears in `/uae-en/shop` and `/oman-en/shop` within seconds.
3. Edit the product, untick “Sold here” for Oman → it disappears from the Oman shop.
4. Categories / Brands / Promotions: add, edit, delete (deleting a category that has products must show an error).
5. Place an order on the storefront → Admin → Orders shows it as *Pending* with the same order ID that was in the WhatsApp message.
6. Change status to *Confirmed* → Inventory stock decreases; *Cancelled* → stock restored.
7. Dashboard shows the order counts, sales per currency and best sellers.
8. Staff role: create a user with role `staff` → can open Orders only; `/admin/products` redirects to Orders.
9. Sign out; visit `/admin/products` → redirected to login.
10. `POST /api/admin/upload` without a session → 401.
