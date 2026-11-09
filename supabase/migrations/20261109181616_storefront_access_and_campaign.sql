-- Keep anonymous catalog reads independent of privileged role helpers.
-- No new anonymous permissions on administrative functions.
alter policy categories_select on public.categories to authenticated;
create policy categories_visitor_select on public.categories for select to anon using (is_active);
alter policy products_select on public.products to authenticated;
create policy products_visitor_select on public.products for select to anon using (is_active);
alter policy product_images_select on public.product_images to authenticated;
create policy product_images_visitor_select on public.product_images for select to anon
using (exists (select 1 from public.products p where p.id = product_images.product_id and p.is_active));

alter table public.store_settings
  add column home_collection text not null default 'featured'
    check (home_collection in ('featured', 'new', 'promotions')),
  add column hero_product_id uuid references public.products(id) on delete set null,
  add column hero_button_label text not null default 'Explorar camisetas'
    check (length(hero_button_label) between 1 and 40);
create index store_settings_hero_product_idx on public.store_settings(hero_product_id);

-- The checkout now creates reserved tickets. Retire the unused legacy write API.
revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
