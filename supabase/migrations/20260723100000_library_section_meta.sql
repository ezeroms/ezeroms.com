-- Library セクション（Clips / Giants / Chronicle / Media coverage）のページ設定

create table if not exists public.library_section (
  id text primary key
    check (id in ('clips', 'giants', 'chronicle', 'media-coverage')),
  label text not null,
  description text not null default '',
  status text not null default 'published'
    check (status in ('published', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists library_section_set_updated_at on public.library_section;
create trigger library_section_set_updated_at
  before update on public.library_section
  for each row execute function public.set_updated_at();

alter table public.library_section enable row level security;

comment on table public.library_section is
  'Library section page settings (label + published/private)';

comment on column public.library_section.status is
  'published = public site; private = hidden from nav and 404 on public URLs';

insert into public.library_section (id, label, description, status) values
  ('clips', 'Clips', '', 'published'),
  ('giants', 'The shoulders of Giants', '', 'published'),
  ('chronicle', 'Chronicle', '', 'published'),
  ('media-coverage', 'Media coverage', '', 'published')
on conflict (id) do nothing;
