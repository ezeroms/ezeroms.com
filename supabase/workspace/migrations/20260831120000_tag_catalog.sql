-- Workspace tag catalog: groups + ordered tags (shared by Docs / Tasks).
-- Existing tag strings on docs/tasks are copied into the catalog as ungrouped.
-- Apply:
--   npm run db:apply -- supabase/workspace/migrations/20260831120000_tag_catalog.sql

create table if not exists public.workspace_tag_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_tag_groups_set_updated_at on public.workspace_tag_groups;
create trigger workspace_tag_groups_set_updated_at
  before update on public.workspace_tag_groups
  for each row execute function public.set_updated_at();

alter table public.workspace_tag_groups enable row level security;

create index if not exists workspace_tag_groups_sort_idx
  on public.workspace_tag_groups (sort_order);

create table if not exists public.workspace_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_id uuid references public.workspace_tag_groups (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_tags_name_unique unique (name)
);

drop trigger if exists workspace_tags_set_updated_at on public.workspace_tags;
create trigger workspace_tags_set_updated_at
  before update on public.workspace_tags
  for each row execute function public.set_updated_at();

alter table public.workspace_tags enable row level security;

create index if not exists workspace_tags_group_id_idx
  on public.workspace_tags (group_id);
create index if not exists workspace_tags_sort_idx
  on public.workspace_tags (group_id, sort_order);

comment on table public.workspace_tag_groups is 'Named groups for workspace tags';
comment on table public.workspace_tags is 'Canonical workspace tags (Docs / Tasks), with optional group and sort order';

insert into public.workspace_tags (name, sort_order)
select name, (row_number() over (order by name) - 1)::int
from (
  select distinct btrim(x) as name
  from (
    select unnest(coalesce(tags, '{}'::text[])) as x from public.docs
    union
    select unnest(coalesce(tags, '{}'::text[])) as x from public.tasks
  ) raw
  where btrim(x) <> ''
) named
on conflict (name) do nothing;
