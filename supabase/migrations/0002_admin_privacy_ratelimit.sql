-- =============================================================
-- 0002: admin automático, consentimiento de datos (Ley 1581)
--       y límite anti-spam en pedidos
-- =============================================================

-- ---------- Admin automático por correo ----------
-- Lista de correos que se vuelven admin al registrarse en Supabase Auth.
create table public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security; -- sin políticas: solo SQL/servidor

insert into public.admin_emails (email) values ('elbanquillodepablo@gmail.com');

create or replace function public.grant_admin_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.admin_emails e where e.email = lower(new.email)) then
    insert into public.admins (user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function public.grant_admin_on_signup() from public, anon, authenticated;

create trigger on_auth_user_created_grant_admin
  after insert on auth.users
  for each row execute function public.grant_admin_on_signup();

-- por si el usuario ya existe
insert into public.admins (user_id)
select u.id from auth.users u join public.admin_emails e on e.email = lower(u.email)
on conflict do nothing;

-- ---------- Consentimiento de tratamiento de datos ----------
alter table public.orders add column privacy_accepted_at timestamptz;

-- ---------- create_order v2 ----------
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns table (order_id uuid, order_code text, order_total integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_total integer := 0;
  v_code  text;
  v_id    uuid;
  v_phone text := regexp_replace(coalesce(p_customer->>'phone', ''), '\D', '', 'g');
  r       record;
  prod    record;
begin
  -- honeypot: los bots llenan el campo oculto "website"
  if coalesce(p_customer->>'website', '') <> '' then
    raise exception 'Solicitud inválida';
  end if;

  if coalesce(p_customer->>'accept_privacy', 'false') <> 'true' then
    raise exception 'Debes aceptar la política de tratamiento de datos';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido';
  end if;

  if coalesce(trim(p_customer->>'customer_name'), '') = ''
     or length(v_phone) < 7
     or coalesce(trim(p_customer->>'city'), '') = ''
     or coalesce(trim(p_customer->>'address'), '') = '' then
    raise exception 'Faltan datos de envío';
  end if;

  -- anti-spam: máximo 5 pedidos por celular por hora y 60 en total por hora
  if (select count(*) from public.orders o
      where regexp_replace(o.phone, '\D', '', 'g') = v_phone
        and o.created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.orders o where o.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Demasiados pedidos seguidos. Escríbenos por WhatsApp y te ayudamos.';
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
                             address, neighborhood, reference, notes, items, subtotal,
                             privacy_accepted_at)
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
          v_items, v_total, now())
  returning id into v_id;

  return query select v_id, v_code, v_total;
end $$;

revoke all on function public.create_order(jsonb, jsonb) from public;
grant execute on function public.create_order(jsonb, jsonb) to anon, authenticated;

create index if not exists orders_phone_created_idx on public.orders (phone, created_at desc);
