-- ezeroms.com content schema
-- Apply in Supabase SQL Editor or: supabase db push

create extension if not exists pg_trgm;

create type public.content_status as enum ('draft', 'published', 'archived');

-- shared trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- about
create table public.about (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- media_coverage
create table public.media_coverage (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date date,
  lead text,
  external_url text,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- diary
create table public.diary (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  date timestamptz not null,
  diary_month text[] not null default '{}',
  diary_tag text[] not null default '{}',
  diary_place text,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diary_date_idx on public.diary (date desc);
create index diary_month_gin on public.diary using gin (diary_month);
create index diary_tag_gin on public.diary using gin (diary_tag);

-- column
create table public."column" (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date timestamptz not null,
  column_month text[] not null default '{}',
  column_category text[] not null default '{}',
  column_tag text[] not null default '{}',
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index column_date_idx on public."column" (date desc);
create index column_category_gin on public."column" using gin (column_category);
create index column_tag_gin on public."column" using gin (column_tag);

-- work
create table public.work (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date timestamptz not null,
  image_url text,
  start_date date,
  end_date date,
  work_category text[] not null default '{}',
  work_tag text[] not null default '{}',
  role text,
  client text,
  agency text,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index work_date_idx on public.work (date desc);
create index work_category_gin on public.work using gin (work_category);

-- shoulders_of_giants
create table public.shoulders_of_giants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  topic text[] not null default '{}',
  book_title text,
  author text,
  publisher text,
  published_year text,
  citation_override text,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index giants_topic_gin on public.shoulders_of_giants using gin (topic);

-- snap
create table public.snap (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date timestamptz not null,
  location text,
  camera text,
  image_url text,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index snap_date_idx on public.snap (date desc);

-- chronicle
create table public.chronicle (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  date date not null,
  category text,
  subcategory text,
  chronicle_tag text[] not null default '{}',
  description text,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chronicle_date_idx on public.chronicle (date desc);
create index chronicle_tag_gin on public.chronicle using gin (chronicle_tag);
create index chronicle_category_idx on public.chronicle (category);

-- ui_design_guidebook
create table public.ui_design_guidebook (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  section text not null check (section in ('components', 'patterns', 'principles', 'readme', 'other')),
  title text not null,
  description text,
  tags text[] not null default '{}',
  sort_order int not null default 0,
  body_html text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index uidg_section_idx on public.ui_design_guidebook (section, sort_order);

-- updated_at triggers
-- Note: use (name || '_set_updated_at') so reserved table "column" does not become "column"_set_updated_at
-- EXECUTE accepts only one statement at a time
do $$
declare
  t text;
  trig text;
begin
  foreach t in array array[
    'about', 'media_coverage', 'diary', 'column', 'work',
    'shoulders_of_giants', 'snap', 'chronicle', 'ui_design_guidebook'
  ]
  loop
    trig := t || '_set_updated_at';
    execute format('drop trigger if exists %I on public.%I', trig, t);
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.set_updated_at()',
      trig, t
    );
  end loop;
end $$;

-- RLS: deny anon/authenticated direct access; service_role bypasses RLS
alter table public.about enable row level security;
alter table public.media_coverage enable row level security;
alter table public.diary enable row level security;
alter table public."column" enable row level security;
alter table public.work enable row level security;
alter table public.shoulders_of_giants enable row level security;
alter table public.snap enable row level security;
alter table public.chronicle enable row level security;
alter table public.ui_design_guidebook enable row level security;

-- Storage bucket (run in dashboard if storage API preferred)
-- insert into storage.buckets (id, name, public) values ('media', 'media', true)
--   on conflict (id) do nothing;
