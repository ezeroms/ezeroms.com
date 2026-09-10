-- Rename Jumpai → Jampai (table, indexes, triggers, photo_gallery meta)
-- Idempotent: safe to re-run.

-- 1) Rename photo table if old name still exists
do $$
begin
  if to_regclass('public.jumpai') is not null
     and to_regclass('public.jampai') is null then
    alter table public.jumpai rename to jampai;
  end if;
end $$;

-- 2) Ensure table exists (fresh / missing case)
create table if not exists public.jampai (
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

alter table public.jampai add column if not exists image_thumb_url text;
alter table public.jampai add column if not exists is_deleted boolean not null default false;

-- 3) Rename old indexes only when the new name is free
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'jumpai_date_idx'
  ) and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'jampai_date_idx'
  ) then
    alter index public.jumpai_date_idx rename to jampai_date_idx;
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'jumpai_tag_gin'
  ) and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'jampai_tag_gin'
  ) then
    alter index public.jumpai_tag_gin rename to jampai_tag_gin;
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'jumpai_is_deleted_idx'
  ) and not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'jampai_is_deleted_idx'
  ) then
    alter index public.jumpai_is_deleted_idx rename to jampai_is_deleted_idx;
  end if;
end $$;

-- Drop leftover old-named indexes if both old and new exist
drop index if exists public.jumpai_date_idx;
drop index if exists public.jumpai_tag_gin;
drop index if exists public.jumpai_is_deleted_idx;

create index if not exists jampai_date_idx on public.jampai (date desc);
create index if not exists jampai_tag_gin on public.jampai using gin (photo_tag);
create index if not exists jampai_is_deleted_idx on public.jampai (is_deleted)
  where is_deleted = false;

drop trigger if exists jumpai_set_updated_at on public.jampai;
drop trigger if exists jampai_set_updated_at on public.jampai;
create trigger jampai_set_updated_at
  before update on public.jampai
  for each row execute function public.set_updated_at();

alter table public.jampai enable row level security;

comment on table public.jampai is 'Jampai photo gallery — curated photographs';

-- 4) photo_gallery: migrate id + refresh check constraint
-- ラベル・説明文は管理画面で変えている可能性があるので上書きしない。
do $$
begin
  if to_regclass('public.photo_gallery') is null then
    return;
  end if;

  alter table public.photo_gallery drop constraint if exists photo_gallery_id_check;

  if exists (select 1 from public.photo_gallery where id = 'jumpai')
     and not exists (select 1 from public.photo_gallery where id = 'jampai') then
    update public.photo_gallery
    set id = 'jampai'
    where id = 'jumpai';
  elsif exists (select 1 from public.photo_gallery where id = 'jumpai')
        and exists (select 1 from public.photo_gallery where id = 'jampai') then
    delete from public.photo_gallery where id = 'jumpai';
  end if;

  insert into public.photo_gallery (id, label, description)
  values (
    'jampai',
    'Jampai',
    '作品として見せたい写真のギャラリー。Jampai に収めた一枚です。'
  )
  on conflict (id) do nothing;

  alter table public.photo_gallery
    add constraint photo_gallery_id_check
    check (id in ('smile', 'jampai', 'tabekake'));
end $$;
