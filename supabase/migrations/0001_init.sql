-- =============================================================
-- El Banquillo de Pablo — esquema inicial
-- Tablas, enums, seguridad (RLS), storage y función de pedidos
-- =============================================================

-- ---------- Tipos ----------
create type public.kit_type as enum
  ('local', 'visitante', 'tercera', 'cuarta', 'portero', 'entrenamiento', 'retro', 'especial');
create type public.product_version as enum ('fan', 'jugador');
create type public.audience as enum ('adulto', 'nino', 'mujer');
create type public.order_status as enum
  ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado');

-- ---------- Utilidades ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Administradores ----------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

-- ---------- Categorías ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Productos ----------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  team             text not null,
  league           text,
  season           text,
  kit_type         public.kit_type not null default 'local',
  version          public.product_version not null default 'fan',
  audience         public.audience not null default 'adulto',
  category_id      uuid references public.categories (id) on delete set null,
  price            integer not null check (price >= 0),          -- COP sin decimales
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  description      text,
  sizes            text[] not null default '{S,M,L,XL}',
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_active_featured_idx on public.products (is_active, is_featured);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Imágenes ----------
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path       text not null,         -- imagen grande optimizada (webp)
  thumb_path text,                  -- miniatura para tarjetas (webp)
  alt        text,
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

-- ---------- Pedidos ----------
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  customer_name  text not null,
  document_id    text,
  phone          text not null,
  department     text,
  city           text not null,
  address        text not null,
  neighborhood   text,
  reference      text,
  notes          text,
  items          jsonb not null,
  subtotal       integer not null,
  status         public.order_status not null default 'pendiente',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- Ajustes de la tienda (una sola fila) ----------
create table public.store_settings (
  id              int primary key default 1 check (id = 1),
  store_name      text not null default 'El Banquillo de Pablo',
  whatsapp_number text not null default '573000000000',
  instagram_url   text,
  tiktok_url      text,
  city            text default 'Colombia',
  hours           text default 'Lun a Sáb · 9:00 a.m. – 7:00 p.m.',
  hero_title      text default 'Vístete de titular',
  hero_subtitle   text default 'Camisetas de clubes y selecciones. Local, visitante y tercera, versión fan y jugador.',
  shipping_note   text default 'Envíos a toda Colombia. Confirmamos talla, precio y disponibilidad por WhatsApp antes de despachar.',
  updated_at      timestamptz not null default now()
);
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();
insert into public.store_settings (id) values (1);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.admins          enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_images  enable row level security;
alter table public.orders          enable row level security;
alter table public.store_settings  enable row level security;

-- admins: cada usuario puede ver si él mismo es admin
create policy "admins_select_self" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- categorías
create policy "categories_select" on public.categories
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "categories_insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories_update" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories_delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- productos
create policy "products_select" on public.products
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "products_insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products_update" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products_delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- imágenes (visibles si el producto es visible)
create policy "product_images_select" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p
            where p.id = product_id and (p.is_active or (select public.is_admin())))
  );
create policy "product_images_insert" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_images_update" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images_delete" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- pedidos: solo admin lee/edita. Los clientes crean pedidos vía create_order()
create policy "orders_select" on public.orders
  for select to authenticated using ((select public.is_admin()));
create policy "orders_update" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "orders_delete" on public.orders
  for delete to authenticated using ((select public.is_admin()));

-- ajustes
create policy "settings_select" on public.store_settings
  for select to anon, authenticated using (true);
create policy "settings_update" on public.store_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- =============================================================
-- create_order: el precio SIEMPRE se calcula en el servidor
-- =============================================================
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns table (order_id uuid, order_code text, order_total integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_total integer := 0;
  v_code  text;
  v_id    uuid;
  r       record;
  prod    record;
begin
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido';
  end if;

  if coalesce(trim(p_customer->>'customer_name'), '') = ''
     or coalesce(trim(p_customer->>'phone'), '') = ''
     or coalesce(trim(p_customer->>'city'), '') = ''
     or coalesce(trim(p_customer->>'address'), '') = '' then
    raise exception 'Faltan datos de envío';
  end if;

  for r in
    select (i->>'product_id')::uuid                                   as pid,
           coalesce(i->>'size', '')                                    as size,
           greatest(1, least(20, coalesce((i->>'quantity')::int, 1)))  as qty,
           left(coalesce(i->>'custom_name', ''), 20)                   as cname,
           left(coalesce(i->>'custom_number', ''), 3)                  as cnum
    from jsonb_array_elements(p_items) as i
  loop
    select p.id, p.name, p.price, p.sizes into prod
    from public.products p where p.id = r.pid and p.is_active;
    if not found then
      raise exception 'Un producto ya no está disponible';
    end if;
    if r.size <> '' and not (r.size = any (prod.sizes)) then
      raise exception 'Talla % no disponible para %', r.size, prod.name;
    end if;

    v_items := v_items || jsonb_build_object(
      'product_id', prod.id, 'name', prod.name, 'size', r.size,
      'quantity', r.qty, 'unit_price', prod.price,
      'custom_name', nullif(r.cname, ''), 'custom_number', nullif(r.cnum, ''));
    v_total := v_total + prod.price * r.qty;
  end loop;

  v_code := 'BP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (code, customer_name, document_id, phone, department, city,
                             address, neighborhood, reference, notes, items, subtotal)
  values (v_code,
          left(trim(p_customer->>'customer_name'), 120),
          left(p_customer->>'document_id', 20),
          left(trim(p_customer->>'phone'), 20),
          left(p_customer->>'department', 60),
          left(trim(p_customer->>'city'), 60),
          left(trim(p_customer->>'address'), 200),
          left(p_customer->>'neighborhood', 80),
          left(p_customer->>'reference', 200),
          left(p_customer->>'notes', 500),
          v_items, v_total)
  returning id into v_id;

  return query select v_id, v_code, v_total;
end $$;

revoke all on function public.create_order(jsonb, jsonb) from public;
grant execute on function public.create_order(jsonb, jsonb) to anon, authenticated;

-- =============================================================
-- Storage: bucket público de imágenes, solo admin escribe
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880,
        array['image/webp', 'image/avif', 'image/jpeg', 'image/png']);

-- Las URLs públicas no necesitan política SELECT; esta solo permite al admin listar/borrar
create policy "products_bucket_select" on storage.objects
  for select to authenticated using (bucket_id = 'products' and (select public.is_admin()));
create policy "products_bucket_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and (select public.is_admin()));
create policy "products_bucket_update" on storage.objects
  for update to authenticated using (bucket_id = 'products' and (select public.is_admin()));
create policy "products_bucket_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and (select public.is_admin()));
