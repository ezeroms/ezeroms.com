-- Clips: web news/article bookmarks with short memo (+ OGP fields)
create table if not exists public.clip (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_url text not null,
  date timestamptz not null default now(),
  memo text not null default '',
  clip_tag text[] not null default '{}',
  og_image text not null default '',
  og_description text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clip_date_idx on public.clip (date desc);
create index if not exists clip_tag_gin on public.clip using gin (clip_tag);

drop trigger if exists clip_set_updated_at on public.clip;
create trigger clip_set_updated_at
  before update on public.clip
  for each row execute function public.set_updated_at();

alter table public.clip enable row level security;

comment on table public.clip is 'Web clips / memo bookmarks (title, source URL, date, short memo)';
