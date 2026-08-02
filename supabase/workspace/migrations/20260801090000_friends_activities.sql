-- Friends + Activities (交友録).
-- Apply:
--   npm run db:apply -- supabase/workspace/migrations/20260801090000_friends_activities.sql
--
-- Security: RLS enabled with no anon/authenticated policies.
-- Access only via server service_role after admin session checks.

-- ---------------------------------------------------------------------------
-- friends
-- ---------------------------------------------------------------------------
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  family_name text,
  given_name text,
  middle_name text,
  family_name_kana text,
  given_name_kana text,
  middle_name_kana text,
  family_name_en text,
  given_name_en text,
  middle_name_en text,
  english_name text,
  nickname text,
  birthday date,
  birthday_year_known boolean not null default false,
  notes_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint friends_has_identity check (
    nullif(btrim(coalesce(family_name, '')), '') is not null
    or nullif(btrim(coalesce(given_name, '')), '') is not null
    or nullif(btrim(coalesce(english_name, '')), '') is not null
    or nullif(btrim(coalesce(nickname, '')), '') is not null
  )
);

drop trigger if exists friends_set_updated_at on public.friends;
create trigger friends_set_updated_at
  before update on public.friends
  for each row execute function public.set_updated_at();

alter table public.friends enable row level security;

create index if not exists friends_deleted_at_idx on public.friends (deleted_at);
create index if not exists friends_updated_at_idx on public.friends (updated_at desc);
create index if not exists friends_family_name_idx on public.friends (family_name);
create index if not exists friends_given_name_idx on public.friends (given_name);

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_source text not null default 'manual'
    check (title_source in ('manual', 'calendar')),
  occurred_at timestamptz,
  ended_at timestamptz,
  what_md text,
  notes_md text,
  location text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

alter table public.activities enable row level security;

create index if not exists activities_deleted_at_idx on public.activities (deleted_at);
create index if not exists activities_occurred_at_idx on public.activities (occurred_at desc nulls last);
create index if not exists activities_updated_at_idx on public.activities (updated_at desc);
create index if not exists activities_tags_gin_idx on public.activities using gin (tags);

-- ---------------------------------------------------------------------------
-- activity_friends (who attended)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_friends (
  activity_id uuid not null references public.activities (id) on delete cascade,
  friend_id uuid not null references public.friends (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, friend_id)
);

alter table public.activity_friends enable row level security;

create index if not exists activity_friends_friend_id_idx
  on public.activity_friends (friend_id);

-- ---------------------------------------------------------------------------
-- activity_calendar_links (optional Google Calendar reference)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_calendar_links (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  google_calendar_id text not null,
  google_event_id text not null,
  sync_status text not null default 'linked'
    check (sync_status in ('linked', 'detached')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_calendar_links_activity_unique unique (activity_id),
  constraint activity_calendar_links_google_unique unique (google_calendar_id, google_event_id)
);

drop trigger if exists activity_calendar_links_set_updated_at on public.activity_calendar_links;
create trigger activity_calendar_links_set_updated_at
  before update on public.activity_calendar_links
  for each row execute function public.set_updated_at();

alter table public.activity_calendar_links enable row level security;

create index if not exists activity_calendar_links_google_event_id_idx
  on public.activity_calendar_links (google_event_id);

comment on table public.friends is 'Workspace friends (交友録の人)';
comment on table public.activities is 'Workspace social activities (交友録の出来事; Google event body is optional)';
comment on table public.activity_friends is 'Friends who attended an activity';
comment on table public.activity_calendar_links is 'Optional map from activities to Google Calendar events (no event body)';
