-- Workspace schema (Docs / Tasks / Projects).
-- Default: apply to the same Supabase project as the public site.
--   npm run db:apply -- supabase/workspace/migrations/20260731100000_workspace_init.sql
-- Optional separate project:
--   npm run db:apply:workspace -- supabase/workspace/migrations/20260731100000_workspace_init.sql
--
-- Security: RLS enabled with no anon/authenticated policies.
-- Access only via server service_role after admin session checks.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_md text,
  status text not null default 'inbox'
    check (status in ('inbox', 'active', 'waiting', 'done', 'archived')),
  priority text not null default 'none'
    check (priority in ('none', 'low', 'medium', 'high')),
  project_id uuid references public.projects (id) on delete set null,
  scheduled_date date,
  due_at timestamptz,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz
);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_scheduled_date_idx on public.tasks (scheduled_date);
create index if not exists tasks_due_at_idx on public.tasks (due_at);
create index if not exists tasks_updated_at_idx on public.tasks (updated_at desc);

-- ---------------------------------------------------------------------------
-- docs
-- ---------------------------------------------------------------------------
create table if not exists public.docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_md text not null default '',
  status text not null default 'inbox'
    check (status in ('inbox', 'active', 'archived')),
  project_id uuid references public.projects (id) on delete set null,
  occurred_at timestamptz,
  review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

drop trigger if exists docs_set_updated_at on public.docs;
create trigger docs_set_updated_at
  before update on public.docs
  for each row execute function public.set_updated_at();

alter table public.docs enable row level security;

create index if not exists docs_status_idx on public.docs (status);
create index if not exists docs_project_id_idx on public.docs (project_id);
create index if not exists docs_updated_at_idx on public.docs (updated_at desc);

-- ---------------------------------------------------------------------------
-- item_links (Docs ↔ Tasks etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.item_links (
  id uuid primary key default gen_random_uuid(),
  from_type text not null
    check (from_type in ('doc', 'task', 'project')),
  from_id uuid not null,
  to_type text not null
    check (to_type in ('doc', 'task', 'project')),
  to_id uuid not null,
  relation text not null default 'related'
    check (relation in ('related', 'supports', 'created_from', 'follow_up', 'blocks')),
  created_at timestamptz not null default now(),
  constraint item_links_unique unique (from_type, from_id, to_type, to_id, relation),
  constraint item_links_no_self check (not (from_type = to_type and from_id = to_id))
);

alter table public.item_links enable row level security;

create index if not exists item_links_from_idx on public.item_links (from_type, from_id);
create index if not exists item_links_to_idx on public.item_links (to_type, to_id);

-- ---------------------------------------------------------------------------
-- calendar_links (relation to Google events; event body is not stored)
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_links (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  google_calendar_id text not null,
  google_event_id text not null,
  sync_status text not null default 'linked'
    check (sync_status in ('linked', 'pending', 'error', 'detached')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_links_google_unique unique (google_calendar_id, google_event_id)
);

drop trigger if exists calendar_links_set_updated_at on public.calendar_links;
create trigger calendar_links_set_updated_at
  before update on public.calendar_links
  for each row execute function public.set_updated_at();

alter table public.calendar_links enable row level security;

create index if not exists calendar_links_task_id_idx on public.calendar_links (task_id);

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  actor text not null default 'user'
    check (actor in ('user', 'ai', 'sync')),
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create index if not exists activity_log_entity_idx
  on public.activity_log (entity_type, entity_id);
create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

comment on table public.projects is 'Workspace projects';
comment on table public.tasks is 'Workspace tasks (source of truth in Workspace DB)';
comment on table public.docs is 'Private workspace docs (not public diary/column)';
comment on table public.item_links is 'Links between docs, tasks, and projects';
comment on table public.calendar_links is 'Maps workspace items to Google Calendar events (no event body)';
comment on table public.activity_log is 'Change history for user/AI/sync actions';
