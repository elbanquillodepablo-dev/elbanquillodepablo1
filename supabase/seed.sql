-- Datos iniciales — El Banquillo de Pablo
insert into public.categories (name, slug, description, sort_order) values
  ('Clubes',       'clubes',       'Las camisetas de los grandes clubes del mundo.', 1),
  ('Selecciones',  'selecciones',  'Defiende tu bandera.',                            2),
  ('Retro',        'retro',        'Clásicos que hicieron historia.',                 3),
  ('Edición especial', 'edicion-especial', 'Ediciones limitadas y conceptos únicos.', 4)
on conflict (slug) do nothing;

insert into public.products
  (name, slug, team, league, season, kit_type, version, audience, category_id, price, compare_at_price, description, sizes, is_featured, sort_order)
select v.name, v.slug, 'Real Madrid', 'LaLiga', '2026/27', v.kit::public.kit_type, 'fan', 'adulto',
       (select id from public.categories where slug = 'clubes'),
       v.price, v.compare, v.descr, '{S,M,L,XL,XXL}', v.featured, v.ord
from (values
  ('Real Madrid Local 2026/27',     'real-madrid-local-2026-27',     'local',     189900, 229900, 'El blanco eterno. Tela ligera y transpirable, escudo bordado.', true,  1),
  ('Real Madrid Visitante 2026/27', 'real-madrid-visitante-2026-27', 'visitante', 189900, null::int, 'La segunda piel del Madrid para jugar fuera de casa.',          false, 2),
  ('Real Madrid Tercera 2026/27',   'real-madrid-tercera-2026-27',   'tercera',   189900, null::int, 'Tercera equipación: diseño atrevido para noches europeas.',      false, 3)
) as v(name, slug, kit, price, compare, descr, featured, ord)
on conflict (slug) do nothing;
