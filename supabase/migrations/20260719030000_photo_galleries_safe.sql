-- Photo galleries: smile / jumpai / tabekake
-- Does NOT drop public.snap (既存データを残す)
-- Apply in Supabase SQL Editor, then run:
--   npx tsx scripts/admin/setup-photo-galleries.ts

create table if not exists public.smile (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists smile_date_idx on public.smile (date desc);
create index if not exists smile_tag_gin on public.smile using gin (photo_tag);
drop trigger if exists smile_set_updated_at on public.smile;
create trigger smile_set_updated_at
  before update on public.smile
  for each row execute function public.set_updated_at();
alter table public.smile enable row level security;

create table if not exists public.jumpai (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jumpai_date_idx on public.jumpai (date desc);
create index if not exists jumpai_tag_gin on public.jumpai using gin (photo_tag);
drop trigger if exists jumpai_set_updated_at on public.jumpai;
create trigger jumpai_set_updated_at
  before update on public.jumpai
  for each row execute function public.set_updated_at();
alter table public.jumpai enable row level security;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tabekake_date_idx on public.tabekake (date desc);
create index if not exists tabekake_tag_gin on public.tabekake using gin (photo_tag);
drop trigger if exists tabekake_set_updated_at on public.tabekake;
create trigger tabekake_set_updated_at
  before update on public.tabekake
  for each row execute function public.set_updated_at();
alter table public.tabekake enable row level security;

-- 既存テーブル向け（再実行しても安全）
alter table public.smile add column if not exists image_thumb_url text;
alter table public.jumpai add column if not exists image_thumb_url text;
alter table public.tabekake add column if not exists image_thumb_url text;
