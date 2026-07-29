-- サイト全体（トップページ含む）の設定。現状はデフォルト OGP 画像。

create table if not exists public.site_settings (
  id text primary key
    check (id = 'site'),
  og_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

comment on table public.site_settings is
  'Site-wide settings (singleton id=site). og_image is the default / home Open Graph image.';

comment on column public.site_settings.og_image is
  'Default OGP image URL for the site home (recommended 1200×630). Empty = static fallback.';

insert into public.site_settings (id, og_image) values
  ('site', '')
on conflict (id) do nothing;
