-- Category hierarchy update (owner-approved structure). ADDITIVE and NON-DESTRUCTIVE:
--   * adds categories.active (default true) so retired categories are hidden instead of deleted
--   * upserts the 26 approved categories by slug: new ones are inserted; existing ones keep their slug (so
--     products.category_slug / subcategory_slug keep pointing at the same rows) and are renamed / re-parented / re-sorted
--   * hides (active = false) every category that is not one of the 26 approved slugs
--   * never deletes anything and never touches products, prices, stock, orders or promotions
-- Nesting needs no schema change: categories.parent_slug already references categories.slug at any depth.
-- Existing Arabic names are never overwritten. (This file is pure ASCII on purpose: Arabic is written as unicode escapes.) Run once: re-running is error-free but resets names, order and visibility.
begin;

alter table public.categories add column if not exists active boolean not null default true;

insert into public.categories (slug, name_en, name_ar, parent_slug, sort, active) values
  ('mobile-tablets',            'Mobile & Tablets',          '', null,                   0, true),
  ('mobile-phones',             'Mobile Phones',             '', 'mobile-tablets',       0, true),
  ('mobile-phones-iphones',     'iPhones',                   '', 'mobile-phones',        0, true),
  ('mobile-phones-android',     'Android',                   '', 'mobile-phones',        1, true),
  ('tablets',                   'Tablets',                   '', 'mobile-tablets',       1, true),
  ('tablets-android',           'Android',                   '', 'tablets',              0, true),
  ('tablets-ios',               'iOS',                       '', 'tablets',              1, true),
  ('pre-owned',                 'Pre-Owned',                 '', null,                   1, true),
  ('pre-owned-mobiles',         'Pre-Owned Mobiles',         '', 'pre-owned',            0, true),
  ('pre-owned-mobiles-android', 'Android',                   '', 'pre-owned-mobiles',    0, true),
  ('pre-owned-mobiles-iphones', 'iPhones',                   '', 'pre-owned-mobiles',    1, true),
  ('pre-owned-laptops',         'Pre-Owned Laptops',         '', 'pre-owned',            1, true),
  ('pre-owned-gaming',          'Pre-Owned Gaming',          '', 'pre-owned',            2, true),
  ('smart-watches',             'Wearables & Smart Watches', '', null,                   2, true),
  ('smartwatches',              'Smart Watches',             '', 'smart-watches',        0, true),
  ('fitness-bands',             'Fitness Trackers',          '', 'smart-watches',        1, true),
  ('smart-glasses',             'Smart Glasses',             '', 'smart-watches',        2, true),
  ('earphones-headphones',      'Earphones & Headphones',    '', null,                   3, true),
  ('earphones',                 'Earphones',                 '', 'earphones-headphones', 0, true),
  ('headphones',                'Headphones',                '', 'earphones-headphones', 1, true),
  ('speakers',                  'Speakers',                  '', null,                   4, true),
  ('portable-speakers',         'Portable Speakers',         '', 'speakers',             0, true),
  ('wireless-speakers',         'Wireless Speakers',         '', 'speakers',             1, true),
  ('games',                     'Gaming',                    '', null,                   5, true),
  ('playstation',               'PlayStation',               '', 'games',                0, true),
  ('gaming-accessories',        'Gaming Accessories',        '', 'games',                1, true)
on conflict (slug) do update
  set name_en     = excluded.name_en,
      parent_slug = excluded.parent_slug,
      sort        = excluded.sort,
      active      = true;

-- Arabic that described the OLD English wording: clear it so the site shows English until approved Arabic is added.
-- Only these exact old values are cleared.
update public.categories set name_ar = '' where slug = 'smart-watches' and name_ar = U&'\0627\0644\0633\0627\0639\0627\062A \0627\0644\0630\0643\064A\0629';
update public.categories set name_ar = '' where slug = 'fitness-bands' and name_ar = U&'\0623\0633\0627\0648\0631 \0627\0644\0644\064A\0627\0642\0629';

-- Hide (never delete) every category outside the approved structure.
update public.categories
set active = false
where slug not in (
  'mobile-tablets', 'mobile-phones', 'mobile-phones-iphones', 'mobile-phones-android', 'tablets', 'tablets-android', 'tablets-ios',
  'pre-owned', 'pre-owned-mobiles', 'pre-owned-mobiles-android', 'pre-owned-mobiles-iphones', 'pre-owned-laptops', 'pre-owned-gaming',
  'smart-watches', 'smartwatches', 'fitness-bands', 'smart-glasses',
  'earphones-headphones', 'earphones', 'headphones',
  'speakers', 'portable-speakers', 'wireless-speakers',
  'games', 'playstation', 'gaming-accessories'
);

-- Make the Supabase API (PostgREST) pick up the new column immediately instead of failing with
-- "Could not find the 'active' column of 'categories' in the schema cache".
notify pgrst, 'reload schema';

commit;
