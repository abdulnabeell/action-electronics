-- NOT APPLIED YET - awaiting owner approval.
--
-- Atomic product save. Adds ONE function, public.save_product(...), that writes a product row and its per-country
-- prices in a single database transaction: either everything is saved or nothing is. It changes no tables, no columns
-- and no existing data, and it is only executable by the server (service role), like create_order / set_order_status.
--
-- The admin app already calls it. Until this file is applied the app falls back to separate writes with a best-effort
-- undo, so applying it is safe at any time and can be done after deploying the code.
--
-- Safe to re-run (create or replace).
begin;

create or replace function public.save_product(p_create boolean, p_product jsonb, p_prices jsonb, p_remove text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := p_product ->> 'id';
begin
  if v_id is null or v_id = '' then
    raise exception 'product id is required' using errcode = '22023';
  end if;

  if p_create then
    insert into public.products (
      id, sku, name_en, name_ar, brand_slug, category_slug, subcategory_slug, condition, grade,
      description_en, description_ar, specs_en, specs_ar, images, warranty_en, warranty_ar,
      featured, active, is_demo, updated_at
    ) values (
      v_id, p_product ->> 'sku', p_product ->> 'name_en', coalesce(p_product ->> 'name_ar', ''),
      p_product ->> 'brand_slug', p_product ->> 'category_slug', nullif(p_product ->> 'subcategory_slug', ''),
      p_product ->> 'condition', nullif(p_product ->> 'grade', ''),
      coalesce(p_product ->> 'description_en', ''), coalesce(p_product ->> 'description_ar', ''),
      coalesce(array(select jsonb_array_elements_text(p_product -> 'specs_en')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p_product -> 'specs_ar')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p_product -> 'images')), '{}'),
      coalesce(p_product ->> 'warranty_en', ''), coalesce(p_product ->> 'warranty_ar', ''),
      coalesce((p_product ->> 'featured')::boolean, false), coalesce((p_product ->> 'active')::boolean, true),
      coalesce((p_product ->> 'is_demo')::boolean, false), now()
    );
  else
    update public.products set
      sku = p_product ->> 'sku',
      name_en = p_product ->> 'name_en',
      name_ar = coalesce(p_product ->> 'name_ar', ''),
      brand_slug = p_product ->> 'brand_slug',
      category_slug = p_product ->> 'category_slug',
      subcategory_slug = nullif(p_product ->> 'subcategory_slug', ''),
      condition = p_product ->> 'condition',
      grade = nullif(p_product ->> 'grade', ''),
      description_en = coalesce(p_product ->> 'description_en', ''),
      description_ar = coalesce(p_product ->> 'description_ar', ''),
      specs_en = coalesce(array(select jsonb_array_elements_text(p_product -> 'specs_en')), '{}'),
      specs_ar = coalesce(array(select jsonb_array_elements_text(p_product -> 'specs_ar')), '{}'),
      images = coalesce(array(select jsonb_array_elements_text(p_product -> 'images')), '{}'),
      warranty_en = coalesce(p_product ->> 'warranty_en', ''),
      warranty_ar = coalesce(p_product ->> 'warranty_ar', ''),
      featured = coalesce((p_product ->> 'featured')::boolean, false),
      active = coalesce((p_product ->> 'active')::boolean, true),
      is_demo = coalesce((p_product ->> 'is_demo')::boolean, false),
      updated_at = now()
    where id = v_id;
    if not found then
      raise exception 'product % not found', v_id using errcode = 'P0002';
    end if;
  end if;

  -- countries the product is no longer sold in
  if p_remove is not null and cardinality(p_remove) > 0 then
    delete from public.product_prices where product_id = v_id and country_code = any (p_remove);
  end if;

  -- countries it is sold in (insert or update)
  if p_prices is not null and jsonb_typeof(p_prices) = 'array' and jsonb_array_length(p_prices) > 0 then
    insert into public.product_prices (product_id, country_code, price, compare_at, stock, available)
    select v_id, x.country_code, x.price, x.compare_at, x.stock, coalesce(x.available, true)
    from jsonb_to_recordset(p_prices) as x(country_code text, price numeric, compare_at numeric, stock int, available boolean)
    on conflict (product_id, country_code) do update
      set price = excluded.price, compare_at = excluded.compare_at, stock = excluded.stock, available = excluded.available;
  end if;
end;
$$;

revoke all on function public.save_product(boolean, jsonb, jsonb, text[]) from public, anon, authenticated;
grant execute on function public.save_product(boolean, jsonb, jsonb, text[]) to service_role;

-- let the Supabase API see the new function immediately
notify pgrst, 'reload schema';

commit;
