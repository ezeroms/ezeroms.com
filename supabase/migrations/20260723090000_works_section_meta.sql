-- Works セクション（Creative / Experience / Chooning）のページ設定

create table if not exists public.works_section (
  id text primary key
    check (id in ('creative', 'experience', 'chooning')),
  label text not null,
  description text not null default '',
  status text not null default 'published'
    check (status in ('published', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists works_section_set_updated_at on public.works_section;
create trigger works_section_set_updated_at
  before update on public.works_section
  for each row execute function public.set_updated_at();

alter table public.works_section enable row level security;

comment on table public.works_section is
  'Works section page settings (label + description + published/private)';

comment on column public.works_section.status is
  'published = public site; private = hidden from nav and 404 on public URLs';

insert into public.works_section (id, label, description, status) values
  (
    'creative',
    'Creative',
    'つくったもの・サイトのギャラリー。制作実績を並べて眺める場所です。',
    'published'
  ),
  (
    'experience',
    'Experience',
    'いつ・どこで・何に関わったか。職歴と関与の年表です。',
    'published'
  ),
  (
    'chooning',
    'Chooning',
    '音楽への思いを記録するプロダクト Chooning。特筆して残したい作品です。',
    'published'
  )
on conflict (id) do nothing;
