create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  image_url text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists id text;
alter table public.products add column if not exists name text not null default '';
alter table public.products add column if not exists category text not null default '';
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists image_url text not null default '';
alter table public.products add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

update public.products set id = gen_random_uuid()::text where id is null or btrim(id) = '';
with duplicate_ids as (
  select ctid, row_number() over (partition by id order by ctid) as duplicate_number
  from public.products
)
update public.products as product
set id = gen_random_uuid()::text
from duplicate_ids
where product.ctid = duplicate_ids.ctid
  and duplicate_ids.duplicate_number > 1;

update public.products set name = '' where name is null;
update public.products set category = '' where category is null;
update public.products set description = '' where description is null;
update public.products set image_url = '' where image_url is null;
update public.products set gallery = '[]'::jsonb where gallery is null;
update public.products set options = '[]'::jsonb where options is null;
update public.products set active = true where active is null;
update public.products set sort_order = 0 where sort_order is null;
update public.products set created_at = now() where created_at is null;
update public.products set updated_at = now() where updated_at is null;

alter table public.products alter column id set default gen_random_uuid()::text;
alter table public.products alter column id set not null;
alter table public.products alter column name set not null;
alter table public.products alter column category set not null;
create unique index if not exists products_id_uidx on public.products (id);

alter table public.products enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (active = true);

grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.products to service_role;

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

insert into public.products (id, name, category, description, image_url, options, sort_order)
values
  ('espresso-demo', 'Espresso da casa', 'Cafeteria', 'Cafe encorpado preparado na hora.', 'imgs/demo-cafe.svg', '[{"label":"Curto","price":6},{"label":"Duplo","price":9}]'::jsonb, 10),
  ('cafe-gelado-demo', 'Cafe gelado', 'Cafeteria', 'Cafe suave servido com gelo.', 'imgs/demo-cafe.svg', '[{"label":"300 ml","price":10},{"label":"500 ml","price":14}]'::jsonb, 20),
  ('pao-artesanal-demo', 'Pao artesanal', 'Padaria', 'Pao dourado para acompanhar seu cafe.', 'imgs/demo-pao.svg', '[{"label":"Unidade","price":8}]'::jsonb, 30),
  ('bolo-demo', 'Bolo do dia', 'Confeitaria', 'Uma fatia para deixar a pausa mais gostosa.', 'imgs/demo-bolo.svg', '[{"label":"Fatia","price":7},{"label":"Fatia especial","price":9}]'::jsonb, 40),
  ('cha-demo', 'Cha citrico', 'Bebidas geladas', 'Bebida refrescante com notas citricas.', 'imgs/demo-cha.svg', '[{"label":"300 ml","price":8}]'::jsonb, 50),
  ('combo-demo', 'Combo pausa', 'Combos', 'Uma bebida e um acompanhamento em uma combinacao demonstrativa.', 'imgs/demo-combo.svg', '[{"label":"Cafe + pao","price":13},{"label":"Cha + bolo","price":14}]'::jsonb, 60)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
