-- Clips: OGP site_name など掲載メディア表示名
alter table public.clip
  add column if not exists source_name text not null default '';
