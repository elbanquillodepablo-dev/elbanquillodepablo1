alter table public.store_settings
  add column reservation_schedule_enabled boolean not null default false,
  add column business_days integer[] not null default array[1,2,3,4,5,6],
  add column opens_at time not null default '09:00',
  add column closes_at time not null default '19:00',
  add constraint valid_business_hours check (closes_at > opens_at),
  add constraint valid_business_days check (cardinality(business_days) between 1 and 7 and business_days <@ array[0,1,2,3,4,5,6]);

create or replace function public.reservation_deadline()
returns timestamptz language plpgsql stable security definer set search_path = '' as $$
declare s public.store_settings%rowtype; local_now timestamp; next_day date; offset_day integer;
begin
  select * into s from public.store_settings where id = 1;
  if not found or not s.reservation_schedule_enabled then return now() + interval '2 hours'; end if;
  local_now := now() at time zone 'America/Bogota';
  if extract(dow from local_now)::integer = any(s.business_days)
     and local_now::time >= s.opens_at and local_now::time < s.closes_at then
    return now() + interval '2 hours';
  end if;
  for offset_day in 0..7 loop
    next_day := local_now::date + offset_day;
    if extract(dow from next_day)::integer = any(s.business_days)
       and next_day + s.opens_at > local_now then
      return ((next_day + s.opens_at) at time zone 'America/Bogota') + interval '2 hours';
    end if;
  end loop;
  raise exception 'Configura al menos un día de atención';
end $$;
revoke all on function public.reservation_deadline() from public, anon, authenticated;

-- Keep the existing reservation validation and locking unchanged.
do $$
declare signature text; definition text;
begin
  foreach signature in array array['public.reserve_guest_cart(text,jsonb)', 'public.create_guest_ticket(text,text,boolean)'] loop
    definition := pg_get_functiondef(signature::regprocedure);
    if position('now() + interval ''2 hours''' in definition) = 0 then
      raise exception 'Unexpected reservation function definition: %', signature;
    end if;
    execute replace(definition, 'now() + interval ''2 hours''', 'public.reservation_deadline()');
  end loop;
end $$;
