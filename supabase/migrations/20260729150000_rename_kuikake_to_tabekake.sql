-- Rename Kuikake → Tabekake (table, indexes, triggers, photo_gallery meta)
-- Idempotent: safe to re-run.

-- 1) Rename photo table if old name still exists
do $$
begin
  if to_regclass('public.kuikake') is not null
     and to_regclass('public.tabekake') is null then
    alter table public.kuikake rename to tabekake;
  end if;
end $$;

-- 2) Ensure table exists (fresh / missing case)
create table if not exists public.tabekake (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date timestamptz not null default now(),
  location text,
  camera text,
  image_url text,
  image_thumb_url text,
  photo_tag text[] not null default '{}',
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tabekake add column if not exists image_thumb_url text;
alter table public.tabekake add column if not exists is_deleted boolean not null default false;

-- 3) Rename old indexes only when the new name is free
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'kuikake_date_idx'
  ) and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'tabekake_date_idx'
  ) then
    alter index public.kuikake_date_idx rename to tabekake_date_idx;
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'kuikake_tag_gin'
  ) and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'tabekake_tag_gin'
  ) then
    alter index public.kuikake_tag_gin rename to tabekake_tag_gin;
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'kuikake_is_deleted_idx'
  ) and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'tabekake_is_deleted_idx'
  ) then
    alter index public.kuikake_is_deleted_idx rename to tabekake_is_deleted_idx;
  end if;
end $$;

-- Drop leftover old-named indexes if both old and new exist
drop index if exists public.kuikake_date_idx;
drop index if exists public.kuikake_tag_gin;
drop index if exists public.kuikake_is_deleted_idx;

create index if not exists tabekake_date_idx on public.tabekake (date desc);
create index if not exists tabekake_tag_gin on public.tabekake using gin (photo_tag);
create index if not exists tabekake_is_deleted_idx on public.tabekake (is_deleted)
  where is_deleted = false;

drop trigger if exists kuikake_set_updated_at on public.tabekake;
drop trigger if exists tabekake_set_updated_at on public.tabekake;
create trigger tabekake_set_updated_at
  before update on public.tabekake
  for each row execute function public.set_updated_at();

alter table public.tabekake enable row level security;

comment on table public.tabekake is 'Tabekake photo gallery — curated photographs';

-- 4) photo_gallery: migrate id + refresh check constraint
do $$
begin
  if to_regclass('public.photo_gallery') is null then
    return;
  end if;

  alter table public.photo_gallery drop constraint if exists photo_gallery_id_check;

  if exists (select 1 from public.photo_gallery where id = 'kuikake')
     and not exists (select 1 from public.photo_gallery where id = 'tabekake') then
    update public.photo_gallery
    set
      id = 'tabekake',
      label = 'Tabekake',
      description = '作品として見せたい写真のギャラリー。Tabekake に収めた一枚です。'
    where id = 'kuikake';
  elsif exists (select 1 from public.photo_gallery where id = 'kuikake')
        and exists (select 1 from public.photo_gallery where id = 'tabekake') then
    delete from public.photo_gallery where id = 'kuikake';
  end if;

  insert into public.photo_gallery (id, label, description)
  values (
    'tabekake',
    'Tabekake',
    '作品として見せたい写真のギャラリー。Tabekake に収めた一枚です。'
  )
  on conflict (id) do update
  set
    label = excluded.label,
    description = excluded.description;

  alter table public.photo_gallery
    add constraint photo_gallery_id_check
    check (id in ('smile', 'jumpai', 'tabekake'));
end $$;
