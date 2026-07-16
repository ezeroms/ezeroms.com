-- Experience: employment / involvement timeline (separate from Creative / work)
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

comment on table public.experience is
  'Career / involvement periods (when / where / role). Separate from Creative work.';
comment on column public.experience.projects is
  'JSON array of {title, description?} — Creative linking deferred';
