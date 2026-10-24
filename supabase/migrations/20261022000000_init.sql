-- Action Electronics storefront schema.
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to run once on an empty project.
--
-- Security model:
--   * Row Level Security is ON for every table.
--   * The public (anon) role can only READ active catalogue data (countries, categories, brands, products,
--     product_prices, promotions). It can never read or write orders, order_items or admin_users.
--   * All writes (orders, admin edits) go through server code that uses the service-role key, which is
--     never exposed to the browser.

create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled');

-- ---------------------------------------------------------------- countries
create table public.countries (
  code text primary key check (code in ('uae', 'oman')),
  name_en text not null,
  name_ar text not null,
  currency text not null,
  currency_decimals smallint not null default 2 check (currency_decimals between 0 and 3),
  whatsapp_number text not null default '' check (whatsapp_number ~ '^[0-9]*$'),
  phone text not null default '',
  phone_display text not null default '',
  email text not null default '',
  address_en text not null default '',
  address_ar text not null default '',
  maps_link text not null default '',
  maps_embed text not null default '',
  delivery_info_en text not null default '',
  delivery_info_ar text not null default '',
  delivery_fee numeric(12, 3) not null default 0 check (delivery_fee >= 0),
  free_delivery_over numeric(12, 3) check (free_delivery_over is null or free_delivery_over >= 0),
  regions jsonb not null default '[]',
  hours jsonb not null default '[]',
  open_days smallint[] not null default '{}',
  open_hour smallint not null default 0,
  close_hour smallint not null default 0,
  time_zone text not null default 'Asia/Dubai',
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- catalogue
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_ar text not null,
  parent_slug text references public.categories (slug) on delete restrict,
  sort int not null default 0
);

create table public.brands (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  is_demo boolean not null default false
);

-- products.id IS the URL slug (immutable once created).
create table public.products (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null unique,
  name_en text not null,
  name_ar text not null default '',
  brand_slug text not null references public.brands (slug) on update cascade,
  category_slug text not null references public.categories (slug) on update cascade,
  subcategory_slug text references public.categories (slug) on update cascade,
  condition text not null default 'new' check (condition in ('new', 'pre_owned')),
  grade text,
  description_en text not null default '',
  description_ar text not null default '',
  specs_en text[] not null default '{}',
  specs_ar text[] not null default '{}',
  images text[] not null default '{}',
  warranty_en text not null default '',
  warranty_ar text not null default '',
  featured boolean not null default false,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_slug);
create index products_condition_idx on public.products (condition);

-- Regional price / stock / availability. A product with no row for a country is not sold there.
-- Prices are stored per country and are never converted between currencies.
create table public.product_prices (
  product_id text not null references public.products (id) on delete cascade on update cascade,
  country_code text not null references public.countries (code) on update cascade,
  price numeric(12, 3) not null check (price >= 0),
  compare_at numeric(12, 3) check (compare_at is null or compare_at >= 0),
  stock int not null default 0 check (stock >= 0),
  available boolean not null default true,
  primary key (product_id, country_code)
);

create table public.promotions (
  id text primary key default gen_random_uuid()::text,
  title_en text not null,
  title_ar text not null default '',
  subtitle_en text not null default '',
  subtitle_ar text not null default '',
  image_url text,
  link_path text,
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
  scope text not null default 'all' check (scope in ('all', 'category', 'brand', 'product')),
  scope_value text,
  country_code text references public.countries (code) on update cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort int not null default 0
);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  country_code text not null references public.countries (code),
  lang text not null check (lang in ('en', 'ar')),
  status public.order_status not null default 'pending',
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null default '',
  region text not null default '',
  method text not null check (method in ('delivery', 'pickup')),
  address text not null default '',
  notes text not null default '',
  currency text not null,
  subtotal numeric(12, 3) not null,
  delivery_fee numeric(12, 3) not null default 0,
  total numeric(12, 3) not null,
  whatsapp_number text not null default '',
  stock_committed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null, -- snapshot, deliberately no FK so history survives product deletion
  sku text not null,
  name text not null,
  qty int not null check (qty > 0),
  unit_price numeric(12, 3) not null,
  line_total numeric(12, 3) not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
alter table public.countries enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;

create policy "public read countries" on public.countries for select to anon, authenticated using (enabled);
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "public read brands" on public.brands for select to anon, authenticated using (true);
create policy "public read active products" on public.products for select to anon, authenticated using (active);
create policy "public read prices of active products" on public.product_prices for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "public read active promotions" on public.promotions for select to anon, authenticated using (active);
-- orders, order_items, admin_users: no policies => no access for anon/authenticated. Service role bypasses RLS.

-- ---------------------------------------------------------------- functions (service role only)
-- Atomically create an order and its line items.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.orders (
    order_code, country_code, lang, customer_name, customer_phone, customer_email, region, method, address, notes,
    currency, subtotal, delivery_fee, total, whatsapp_number
  ) values (
    p_order ->> 'order_code', p_order ->> 'country_code', p_order ->> 'lang', p_order ->> 'customer_name',
    p_order ->> 'customer_phone', coalesce(p_order ->> 'customer_email', ''), coalesce(p_order ->> 'region', ''),
    p_order ->> 'method', coalesce(p_order ->> 'address', ''), coalesce(p_order ->> 'notes', ''),
    p_order ->> 'currency', (p_order ->> 'subtotal')::numeric, (p_order ->> 'delivery_fee')::numeric,
    (p_order ->> 'total')::numeric, coalesce(p_order ->> 'whatsapp_number', '')
  ) returning id into v_id;

  insert into public.order_items (order_id, product_id, sku, name, qty, unit_price, line_total)
  select v_id, i ->> 'product_id', i ->> 'sku', i ->> 'name', (i ->> 'qty')::int,
         (i ->> 'unit_price')::numeric, (i ->> 'line_total')::numeric
  from jsonb_array_elements(p_items) as i;

  return p_order ->> 'order_code';
end;
$$;

-- Change an order's status and keep stock consistent:
--   first move to confirmed/processing/shipped/completed => stock is deducted once;
--   move back to pending/cancelled after that          => stock is restored.
create or replace function public.set_order_status(p_order uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  r record;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then
    raise exception 'order not found';
  end if;

  if p_status in ('confirmed', 'processing', 'shipped', 'completed') and not o.stock_committed then
    for r in select product_id, qty from public.order_items where order_id = p_order loop
      update public.product_prices set stock = greatest(0, stock - r.qty)
        where product_id = r.product_id and country_code = o.country_code;
    end loop;
    update public.orders set stock_committed = true where id = p_order;
  elsif p_status in ('pending', 'cancelled') and o.stock_committed then
    for r in select product_id, qty from public.order_items where order_id = p_order loop
      update public.product_prices set stock = stock + r.qty
        where product_id = r.product_id and country_code = o.country_code;
    end loop;
    update public.orders set stock_committed = false where id = p_order;
  end if;

  update public.orders set status = p_status, updated_at = now() where id = p_order;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, public.order_status) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
grant execute on function public.set_order_status(uuid, public.order_status) to service_role;

-- ---------------------------------------------------------------- admin reporting views (service role only)
-- Sales figures are per currency: AED and OMR are never added together.
create view public.admin_order_stats with (security_invoker = true) as
  select country_code, currency, status, count(*)::int as orders, coalesce(sum(total), 0) as total
  from public.orders
  group by country_code, currency, status;

create view public.admin_best_sellers with (security_invoker = true) as
  select oi.product_id, max(oi.name) as name, max(oi.sku) as sku, o.currency,
         sum(oi.qty)::int as units, sum(oi.line_total) as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status <> 'cancelled'
  group by oi.product_id, o.currency;

revoke all on public.admin_order_stats from anon, authenticated;
revoke all on public.admin_best_sellers from anon, authenticated;
