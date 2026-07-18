-- Editable metadata for Photos galleries (Smile / Jampai / Kuikake)

create table if not exists public.photo_gallery (
  id text primary key
    check (id in ('smile', 'jumpai', 'kuikake')),
  label text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists photo_gallery_set_updated_at on public.photo_gallery;
create trigger photo_gallery_set_updated_at
  before update on public.photo_gallery
  for each row execute function public.set_updated_at();

alter table public.photo_gallery enable row level security;

comment on table public.photo_gallery is
  'Photos section gallery settings (label + description shown on public index)';

insert into public.photo_gallery (id, label, description) values
  (
    'smile',
    'Smile',
    '作品として見せたい写真のギャラリー。Smile に収めた一枚です。'
  ),
  (
    'jumpai',
    'Jampai',
    '作品として見せたい写真のギャラリー。Jampai に収めた一枚です。'
  ),
  (
    'kuikake',
    'Kuikake',
    '作品として見せたい写真のギャラリー。Kuikake に収めた一枚です。'
  )
on conflict (id) do nothing;
