-- カテゴリー（一覧ページ）用の OGP 画像

alter table public.photo_gallery
  add column if not exists og_image text not null default '';

alter table public.works_section
  add column if not exists og_image text not null default '';

alter table public.library_section
  add column if not exists og_image text not null default '';

comment on column public.photo_gallery.og_image is
  'Listing / fallback OGP image URL for the gallery';
comment on column public.works_section.og_image is
  'Listing / fallback OGP image URL for the works section';
comment on column public.library_section.og_image is
  'Listing / fallback OGP image URL for the library section';

-- Writing（Notes / Column）ページ設定
create table if not exists public.writing_section (
  id text primary key
    check (id in ('notes', 'column')),
  label text not null,
  description text not null default '',
  status text not null default 'published'
    check (status in ('published', 'private')),
  og_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists writing_section_set_updated_at on public.writing_section;
create trigger writing_section_set_updated_at
  before update on public.writing_section
  for each row execute function public.set_updated_at();

alter table public.writing_section enable row level security;

comment on table public.writing_section is
  'Writing section page settings (Notes / Column): label, status, og_image';

insert into public.writing_section (id, label, description, status, og_image) values
  (
    'notes',
    'Notes',
    '日常の短いメモとスナップ。気づきや記録を残す場所です。',
    'published',
    ''
  ),
  (
    'column',
    'Column',
    '長めの記事。技術・考察・エッセイなど、きちんと書き切る場所です。',
    'published',
    ''
  )
on conflict (id) do nothing;
