-- Experience: create table (if missing) + company meta + og_image + soft delete
-- Safe to re-run in Supabase SQL editor when earlier experience migrations were skipped.

create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  organization text not null,
  employment_type text,
  title text not null default '',
  role text,
  start_date date not null,
  end_date date,
  summary text not null default '',
  body_html text not null default '',
  projects jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_dates_idx
  on public.experience (start_date desc, end_date desc nulls first);
create index if not exists experience_status_idx on public.experience (status);

drop trigger if exists experience_set_updated_at on public.experience;
create trigger experience_set_updated_at
  before update on public.experience
  for each row execute function public.set_updated_at();

alter table public.experience enable row level security;

alter table public.experience
  add column if not exists business text;
alter table public.experience
  add column if not exists employee_count text;
alter table public.experience
  add column if not exists capital text;
alter table public.experience
  add column if not exists note text;
alter table public.experience
  add column if not exists og_image text not null default '';
alter table public.experience
  add column if not exists is_deleted boolean not null default false;

create index if not exists experience_is_deleted_idx on public.experience (is_deleted)
  where is_deleted = false;

comment on table public.experience is
  'Career / involvement periods (when / where / role). Separate from Creative work.';
comment on column public.experience.projects is
  'JSON array of {title, description?, start_date?, end_date?, role?, team_scale?, tasks?}';
comment on column public.experience.business is '事業内容';
comment on column public.experience.employee_count is '従業員数（表示用）';
comment on column public.experience.capital is '資本金（表示用）';
comment on column public.experience.note is '補足（売却・社名変更など）';
comment on column public.experience.og_image is 'OGP image URL (recommended 1200×630)';
