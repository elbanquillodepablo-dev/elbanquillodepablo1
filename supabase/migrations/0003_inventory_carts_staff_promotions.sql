-- Inventario por talla, reservas de carrito, tickets de WhatsApp,
-- roles de personal y promociones con vigencia.

-- Roles internos: el administrador puede gestionar el negocio; el operario
-- trabaja inventario y seguimiento de tickets.
alter table public.admins
  add column role text not null default 'admin' check (role in ('admin', 'operario')),
  add column is_active boolean not null default true;

create or replace function public.has_staff_role(p_roles text[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = (select auth.uid())
      and a.is_active
      and a.role = any (p_roles)
  );
$$;
revoke all on function public.has_staff_role(text[]) from public, anon;
grant execute on function public.has_staff_role(text[]) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_staff_role(array['admin']::text[]);
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.staff_invites (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('admin', 'operario')),
  invited_by uuid not null references public.admins(user_id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
alter table public.staff_invites enable row level security;

-- Preparar bootstrap del administrador inicial; el registro Auth se crea
-- mediante invitación segura desde el servidor de Vercel.
insert into public.admin_emails(email) values ('elbanquillodepablo@gmail.com')
on conflict (email) do nothing;

create or replace function public.grant_admin_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
begin
  select i.role into v_role
  from public.staff_invites i
  where i.email = lower(new.email) and i.expires_at > now();

  if v_role is null and exists (
    select 1 from public.admin_emails e where e.email = lower(new.email)
  ) then
    v_role := 'admin';
  end if;

  if v_role is not null then
    insert into public.admins (user_id, role, is_active)
    values (new.id, v_role, true)
    on conflict (user_id) do update set role = excluded.role, is_active = true;
    delete from public.staff_invites where email = lower(new.email);
  end if;
  return new;
end $$;
revoke all on function public.grant_admin_on_signup() from public, anon, authenticated;

-- ---------- Existencias por producto y talla ----------
create table public.product_inventory (
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  updated_by uuid references public.admins(user_id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (product_id, size)
);
alter table public.product_inventory enable row level security;
create policy inventory_staff_select on public.product_inventory
  for select to authenticated using ((select public.has_staff_role(array['admin','operario']::text[])));
create policy inventory_staff_insert on public.product_inventory
  for insert to authenticated with check ((select public.has_staff_role(array['admin']::text[])));
create policy inventory_staff_update on public.product_inventory
  for update to authenticated
  using ((select public.has_staff_role(array['admin','operario']::text[])))
  with check ((select public.has_staff_role(array['admin','operario']::text[])));

create table public.inventory_adjustments (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  previous_stock integer not null,
  new_stock integer not null,
  actor_id uuid references public.admins(user_id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.inventory_adjustments enable row level security;
create policy inventory_adjustments_staff_select on public.inventory_adjustments
  for select to authenticated using ((select public.has_staff_role(array['admin','operario']::text[])));

create or replace function public.audit_inventory_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_reserved integer;
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  if tg_op = 'UPDATE' and new.stock_on_hand < old.stock_on_hand then
    select coalesce(sum(x.quantity), 0)::integer into v_reserved from (
      select ci.quantity from public.cart_items ci join public.cart_sessions cs on cs.id = ci.cart_id
        where ci.product_id = new.product_id and ci.size = new.size and cs.status = 'active' and cs.expires_at > now()
      union all
      select ti.quantity from public.cart_ticket_items ti join public.cart_tickets t on t.id = ti.ticket_id
        where ti.product_id = new.product_id and ti.size = new.size and t.status = 'pending' and t.expires_at > now()
    ) x;
    if new.stock_on_hand < v_reserved then raise exception 'No puedes bajar el inventario por debajo de las unidades reservadas'; end if;
  end if;
  if tg_op = 'UPDATE' and old.stock_on_hand is distinct from new.stock_on_hand then
    insert into public.inventory_adjustments(product_id, size, previous_stock, new_stock, actor_id)
    values (new.product_id, new.size, old.stock_on_hand, new.stock_on_hand, (select auth.uid()));
  elsif tg_op = 'INSERT' and new.stock_on_hand <> 0 then
    insert into public.inventory_adjustments(product_id, size, previous_stock, new_stock, actor_id)
    values (new.product_id, new.size, 0, new.stock_on_hand, (select auth.uid()));
  end if;
  return new;
end $$;
create trigger product_inventory_audit before insert or update on public.product_inventory
  for each row execute function public.audit_inventory_change();

create or replace function public.sync_product_inventory_sizes()
returns trigger language plpgsql set search_path = '' as $$
begin
  insert into public.product_inventory(product_id, size, stock_on_hand)
  select new.id, s.size, 0 from unnest(new.sizes) as s(size)
  on conflict (product_id, size) do nothing;
  return new;
end $$;
create trigger products_inventory_sizes after insert or update of sizes on public.products
  for each row execute function public.sync_product_inventory_sizes();

insert into public.product_inventory(product_id, size, stock_on_hand)
select p.id, s.size, 0 from public.products p cross join lateral unnest(p.sizes) as s(size)
on conflict (product_id, size) do nothing;

-- ---------- Carritos de invitado y tickets ----------
create table public.cart_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'converted')),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now()
);
create index cart_sessions_active_expiry_idx on public.cart_sessions(expires_at) where status = 'active';
create table public.cart_items (
  cart_id uuid not null references public.cart_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  size text not null,
  quantity integer not null check (quantity between 1 and 20),
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  custom_name text not null default '',
  custom_number text not null default '',
  primary key (cart_id, product_id, size, custom_name, custom_number)
);
create index cart_items_variant_idx on public.cart_items(product_id, size, cart_id);
create table public.cart_tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null check (length(customer_name) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  expires_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  confirmed_at timestamptz,
  confirmed_by uuid references public.admins(user_id) on delete set null,
  resolved_by uuid references public.admins(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cart_tickets_created_idx on public.cart_tickets(created_at desc);
create index cart_tickets_pending_expiry_idx on public.cart_tickets(expires_at) where status = 'pending';
create trigger cart_tickets_updated_at before update on public.cart_tickets
  for each row execute function public.set_updated_at();
create table public.cart_ticket_items (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.cart_tickets(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  size text not null,
  quantity integer not null check (quantity between 1 and 20),
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  custom_name text not null default '',
  custom_number text not null default ''
);
create index cart_ticket_items_ticket_idx on public.cart_ticket_items(ticket_id);
create index cart_ticket_items_variant_idx on public.cart_ticket_items(product_id, size, ticket_id);

alter table public.cart_sessions enable row level security;
alter table public.cart_items enable row level security;
alter table public.cart_tickets enable row level security;
alter table public.cart_ticket_items enable row level security;
create policy cart_tickets_staff_select on public.cart_tickets
  for select to authenticated using ((select public.has_staff_role(array['admin','operario']::text[])));
create policy cart_ticket_items_staff_select on public.cart_ticket_items
  for select to authenticated using ((select public.has_staff_role(array['admin','operario']::text[])));
drop policy if exists orders_select on public.orders;
create policy orders_staff_select on public.orders
  for select to authenticated using ((select public.has_staff_role(array['admin','operario']::text[])));

-- El mejor descuento vigente por producto se aplica automáticamente. No se
-- acumulan promociones y la cotización queda fija durante la reserva.
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 100),
  description text,
  discount_percent integer not null check (discount_percent between 1 and 90),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid references public.admins(user_id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index promotions_active_period_idx on public.promotions(starts_at, ends_at) where is_active;
create table public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
create policy promotions_public_select on public.promotions
  for select to anon, authenticated using (is_active and now() >= starts_at and now() < ends_at);
create policy promotions_admin_manage on public.promotions
  for all to authenticated
  using ((select public.has_staff_role(array['admin']::text[])))
  with check ((select public.has_staff_role(array['admin']::text[])));
create policy promotion_products_public_select on public.promotion_products
  for select to anon, authenticated using (
    exists (select 1 from public.promotions p where p.id = promotion_id and p.is_active and now() >= p.starts_at and now() < p.ends_at)
  );
create policy promotion_products_admin_manage on public.promotion_products
  for all to authenticated
  using ((select public.has_staff_role(array['admin']::text[])))
  with check ((select public.has_staff_role(array['admin']::text[])));
create trigger promotions_updated_at before update on public.promotions
  for each row execute function public.set_updated_at();

create or replace function public.get_store_prices(p_product_ids uuid[])
returns table (product_id uuid, price integer, original_price integer, promotion_title text)
language sql stable security definer set search_path = '' as $$
  select p.id,
    (p.price - floor(p.price * coalesce(best.discount_percent, 0)::numeric / 100))::integer,
    p.price,
    best.title
  from public.products p
  left join lateral (
    select pr.discount_percent, pr.title
    from public.promotion_products pp
    join public.promotions pr on pr.id = pp.promotion_id
    where pp.product_id = p.id and pr.is_active and now() >= pr.starts_at and now() < pr.ends_at
    order by pr.discount_percent desc, pr.created_at desc
    limit 1
  ) best on true
  where p.id = any(p_product_ids) and p.is_active;
$$;
revoke all on function public.get_store_prices(uuid[]) from public;
grant execute on function public.get_store_prices(uuid[]) to anon, authenticated;

create or replace function public.get_guest_inventory(p_product_id uuid)
returns table (size text, stock_on_hand integer, available integer)
language sql stable security definer set search_path = '' as $$
  select i.size, i.stock_on_hand,
    greatest(0, i.stock_on_hand - coalesce((
      select sum(x.quantity) from (
        select ci.quantity from public.cart_items ci join public.cart_sessions cs on cs.id = ci.cart_id
          where ci.product_id = i.product_id and ci.size = i.size and cs.status = 'active' and cs.expires_at > now()
        union all
        select ti.quantity from public.cart_ticket_items ti join public.cart_tickets t on t.id = ti.ticket_id
          where ti.product_id = i.product_id and ti.size = i.size and t.status = 'pending' and t.expires_at > now()
      ) x
    ), 0))::integer
  from public.product_inventory i join public.products p on p.id = i.product_id
  where i.product_id = p_product_id and p.is_active and i.size = any(p.sizes)
  order by array_position(p.sizes, i.size);
$$;
revoke all on function public.get_guest_inventory(uuid) from public;
grant execute on function public.get_guest_inventory(uuid) to anon, authenticated;

create or replace function public.get_guest_cart(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_cart public.cart_sessions%rowtype;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 100 then
    raise exception 'Token de carrito inválido';
  end if;
  select * into v_cart from public.cart_sessions
    where token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
  if not found then return jsonb_build_object('items', '[]'::jsonb, 'expires_at', null, 'expired', false); end if;
  if v_cart.status <> 'active' or v_cart.expires_at <= now() then
    return jsonb_build_object('items', '[]'::jsonb, 'expires_at', v_cart.expires_at, 'expired', true);
  end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'product_id', ci.product_id, 'size', ci.size, 'quantity', ci.quantity,
      'name', ci.product_name, 'unit_price', ci.unit_price, 'custom_name', ci.custom_name,
      'custom_number', ci.custom_number, 'slug', p.slug,
      'image_path', (select pi.path from public.product_images pi where pi.product_id = p.id order by pi.position limit 1)
    ) order by ci.product_name, ci.size)
    from public.cart_items ci join public.products p on p.id = ci.product_id where ci.cart_id = v_cart.id), '[]'::jsonb),
    'expires_at', v_cart.expires_at, 'expired', false
  );
end $$;

create or replace function public.reserve_guest_cart(p_token text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_cart public.cart_sessions%rowtype;
  r record;
  v_stock integer;
  v_reserved integer;
  v_price integer;
  v_name text;
  v_promo text;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 100 then raise exception 'Token de carrito inválido'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 50 then raise exception 'Carrito inválido'; end if;
  if exists (select 1 from jsonb_array_elements(p_items) e where coalesce((e->>'quantity')::integer, 0) < 1 or coalesce((e->>'quantity')::integer, 0) > 20) then
    raise exception 'La cantidad debe estar entre 1 y 20 por talla';
  end if;

  v_hash := encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
  insert into public.cart_sessions(token_hash) values (v_hash) on conflict (token_hash) do nothing;
  select * into v_cart from public.cart_sessions where token_hash = v_hash for update;
  if v_cart.status = 'converted' then raise exception 'El carrito ya tiene un ticket. Inicia un carrito nuevo.'; end if;
  if v_cart.expires_at <= now() then delete from public.cart_items where cart_id = v_cart.id; end if;

  -- Bloqueo determinista por variante: dos clientes no pueden reservar la última unidad.
  for r in
    select i.product_id, i.size from public.product_inventory i
    join (select (e->>'product_id')::uuid as product_id, e->>'size' as size
          from jsonb_array_elements(p_items) e group by 1, 2) wanted
      on wanted.product_id = i.product_id and wanted.size = i.size
    order by i.product_id, i.size for update of i
  loop null; end loop;

  for r in
    select (e->>'product_id')::uuid as product_id, e->>'size' as size,
      sum((e->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) e group by 1, 2 order by 1, 2
  loop
    if r.quantity > 20 then raise exception 'Máximo 20 unidades por talla'; end if;
    select i.stock_on_hand, p.name,
      (p.price - floor(p.price * coalesce(best.discount_percent, 0)::numeric / 100))::integer
      into v_stock, v_name, v_price
    from public.product_inventory i join public.products p on p.id = i.product_id
    left join lateral (select pr.discount_percent, pr.title from public.promotion_products pp
                       join public.promotions pr on pr.id = pp.promotion_id
                       where pp.product_id = p.id and pr.is_active and now() >= pr.starts_at and now() < pr.ends_at
                       order by pr.discount_percent desc, pr.created_at desc limit 1) best on true
    where i.product_id = r.product_id and i.size = r.size and p.is_active and r.size = any(p.sizes);
    if not found then raise exception 'Producto o talla no disponible'; end if;
    select coalesce(sum(x.quantity), 0)::integer into v_reserved from (
      select ci.quantity from public.cart_items ci join public.cart_sessions cs on cs.id = ci.cart_id
        where ci.product_id = r.product_id and ci.size = r.size and cs.id <> v_cart.id and cs.status = 'active' and cs.expires_at > now()
      union all
      select ti.quantity from public.cart_ticket_items ti join public.cart_tickets t on t.id = ti.ticket_id
        where ti.product_id = r.product_id and ti.size = r.size and t.status = 'pending' and t.expires_at > now()
    ) x;
    if r.quantity > v_stock - v_reserved then raise exception 'Solo hay % unidades disponibles de talla %', greatest(0, v_stock - v_reserved), r.size; end if;
  end loop;

  delete from public.cart_items where cart_id = v_cart.id;
  for r in
    select (e->>'product_id')::uuid as product_id, e->>'size' as size,
      left(coalesce(e->>'custom_name',''), 20) as custom_name,
      left(coalesce(e->>'custom_number',''), 3) as custom_number,
      sum((e->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) e group by 1, 2, 3, 4 order by 1, 2, 3, 4
  loop
    select p.name, (p.price - floor(p.price * coalesce(best.discount_percent, 0)::numeric / 100))::integer
      into v_name, v_price
    from public.products p left join lateral (
      select pr.discount_percent from public.promotion_products pp join public.promotions pr on pr.id = pp.promotion_id
      where pp.product_id = p.id and pr.is_active and now() >= pr.starts_at and now() < pr.ends_at
      order by pr.discount_percent desc, pr.created_at desc limit 1
    ) best on true where p.id = r.product_id and p.is_active and r.size = any(p.sizes);
    insert into public.cart_items(cart_id, product_id, size, quantity, product_name, unit_price, custom_name, custom_number)
    values (v_cart.id, r.product_id, r.size, r.quantity, v_name, v_price, r.custom_name, r.custom_number);
  end loop;
  update public.cart_sessions set status = 'active', last_activity_at = now(), expires_at = now() + interval '2 hours' where id = v_cart.id;
  return jsonb_build_object('expires_at', now() + interval '2 hours');
end $$;

create or replace function public.create_guest_ticket(p_token text, p_customer_name text, p_accept_privacy boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart public.cart_sessions%rowtype; v_ticket public.cart_tickets%rowtype;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 100 then raise exception 'Token de carrito inválido'; end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120 then raise exception 'Escribe tu nombre para registrar el ticket'; end if;
  if p_accept_privacy is distinct from true then raise exception 'Debes aceptar la política de tratamiento de datos'; end if;
  select * into v_cart from public.cart_sessions
    where token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex') for update;
  if not found or v_cart.status <> 'active' or v_cart.expires_at <= now() then raise exception 'La reserva venció. Agrega de nuevo los productos disponibles.'; end if;
  if not exists (select 1 from public.cart_items where cart_id = v_cart.id) then raise exception 'El carrito está vacío'; end if;

  insert into public.cart_tickets(code, customer_name, expires_at, privacy_accepted_at)
  values ('BP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), left(trim(p_customer_name), 120), now() + interval '2 hours', now())
  returning * into v_ticket;
  insert into public.cart_ticket_items(ticket_id, product_id, size, quantity, product_name, unit_price, custom_name, custom_number)
  select v_ticket.id, product_id, size, quantity, product_name, unit_price, custom_name, custom_number
  from public.cart_items where cart_id = v_cart.id;
  delete from public.cart_items where cart_id = v_cart.id;
  update public.cart_sessions set status = 'converted', last_activity_at = now(), expires_at = now() where id = v_cart.id;
  return jsonb_build_object('id', v_ticket.id, 'code', v_ticket.code, 'customer_name', v_ticket.customer_name,
    'expires_at', v_ticket.expires_at,
    'items', (select jsonb_agg(jsonb_build_object('name', product_name, 'size', size, 'quantity', quantity,
        'unit_price', unit_price, 'custom_name', nullif(custom_name,''), 'custom_number', nullif(custom_number,'')))
              from public.cart_ticket_items where ticket_id = v_ticket.id),
    'total', (select sum(quantity * unit_price) from public.cart_ticket_items where ticket_id = v_ticket.id));
end $$;

create or replace function public.confirm_cart_ticket(p_ticket_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if not public.has_staff_role(array['admin']::text[]) then raise exception 'Solo un administrador puede confirmar la venta'; end if;
  perform 1 from public.cart_tickets where id = p_ticket_id and status = 'pending' and expires_at > now() for update;
  if not found then raise exception 'El ticket ya venció o fue resuelto'; end if;
  update public.cart_tickets set status = 'confirmed', confirmed_at = now(), confirmed_by = (select auth.uid()), resolved_by = (select auth.uid()) where id = p_ticket_id;
  for r in select product_id, size, quantity from public.cart_ticket_items where ticket_id = p_ticket_id order by product_id, size loop
    if r.product_id is null then raise exception 'Un producto fue eliminado; cancela este ticket en lugar de confirmarlo'; end if;
    update public.product_inventory set stock_on_hand = stock_on_hand - r.quantity
      where product_id = r.product_id and size = r.size and stock_on_hand >= r.quantity;
    if not found then raise exception 'No hay unidades suficientes para confirmar este ticket'; end if;
  end loop;
end $$;

create or replace function public.cancel_cart_ticket(p_ticket_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_staff_role(array['admin','operario']::text[]) then raise exception 'Sin permiso para resolver tickets'; end if;
  update public.cart_tickets set status = 'cancelled', resolved_by = (select auth.uid())
    where id = p_ticket_id and status = 'pending';
  if not found then raise exception 'El ticket ya fue resuelto'; end if;
end $$;

create or replace function public.update_order_status(p_order_id uuid, p_status public.order_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_staff_role(array['admin','operario']::text[]) then raise exception 'Sin permiso'; end if;
  update public.orders set status = p_status where id = p_order_id;
  if not found then raise exception 'Pedido no encontrado'; end if;
end $$;

create or replace function public.deactivate_staff(p_actor_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text; v_active boolean; v_admin_count integer;
begin
  lock table public.admins in share row exclusive mode;
  if not exists (select 1 from public.admins where user_id = p_actor_id and role = 'admin' and is_active) then
    raise exception 'Solo administradores activos pueden gestionar el equipo';
  end if;
  if p_actor_id = p_user_id then raise exception 'No puedes quitarte tu propio acceso'; end if;
  select role, is_active into v_role, v_active from public.admins where user_id = p_user_id for update;
  if not found then raise exception 'Usuario no encontrado'; end if;
  if v_role = 'admin' and v_active then
    select count(*)::integer into v_admin_count from public.admins where role = 'admin' and is_active;
    if v_admin_count <= 1 then raise exception 'Debe quedar al menos un administrador activo'; end if;
  end if;
  update public.admins set is_active = false where user_id = p_user_id;
end $$;
drop policy if exists orders_update on public.orders;

revoke all on function public.get_guest_cart(text) from public;
revoke all on function public.reserve_guest_cart(text, jsonb) from public;
revoke all on function public.create_guest_ticket(text, text, boolean) from public;
revoke all on function public.confirm_cart_ticket(uuid) from public;
revoke all on function public.cancel_cart_ticket(uuid) from public;
revoke all on function public.update_order_status(uuid, public.order_status) from public;
revoke all on function public.deactivate_staff(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_guest_cart(text) to anon, authenticated;
grant execute on function public.reserve_guest_cart(text, jsonb) to anon, authenticated;
grant execute on function public.create_guest_ticket(text, text, boolean) to anon, authenticated;
grant execute on function public.confirm_cart_ticket(uuid) to authenticated;
grant execute on function public.cancel_cart_ticket(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.deactivate_staff(uuid, uuid) to service_role;

-- is_admin no debe ser invocable por visitantes anónimos.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- Campañas de descuentos ----------
-- El administrador crea promociones por porcentaje, con fechas y productos.
-- El operario no puede cambiar precios ni reglas comerciales.


