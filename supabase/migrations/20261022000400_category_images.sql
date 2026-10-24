-- NOT APPLIED YET - awaiting owner approval.
--
-- Optional category image. ADDITIVE: one nullable column on public.categories, no data is touched and no
-- policy changes (the existing public read policy on categories already covers it; uploads reuse the existing
-- public 'product-images' bucket through the admin-only /api/admin/upload route).
--
-- The app works without this column: categories simply show a product photo or an icon until it is applied.
-- Saving a category image in Admin fails with a clear message until then. Safe to re-run.
begin;

alter table public.categories add column if not exists image_url text;

notify pgrst, 'reload schema';

commit;
