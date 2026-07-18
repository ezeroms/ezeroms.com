-- Kuikake photo gallery (same shape as Smile / Jampai)
-- Apply in Supabase SQL Editor or: supabase db push

create table if not exists public.kuikake (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date timestamptz not null default now(),
  location text,
  camera text,
  image_url text,
  photo_tag text[] not null default '{}',
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kuikake_date_idx on public.kuikake (date desc);
create index if not exists kuikake_tag_gin on public.kuikake using gin (photo_tag);

drop trigger if exists kuikake_set_updated_at on public.kuikake;
create trigger kuikake_set_updated_at
  before update on public.kuikake
  for each row execute function public.set_updated_at();

alter table public.kuikake enable row level security;

comment on table public.kuikake is 'Kuikake photo gallery — curated photographs';
