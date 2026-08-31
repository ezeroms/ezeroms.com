-- Tasks tags (text[]), same vocabulary as docs.tags.
-- Existing project names are copied onto tasks so grouping is not lost.
-- Project は DB 上残し、フロントでは使わない。
-- Apply:
--   npm run db:apply -- supabase/workspace/migrations/20260831100000_tasks_tags.sql

alter table public.tasks
  add column if not exists tags text[] not null default '{}';

create index if not exists tasks_tags_gin_idx on public.tasks using gin (tags);

comment on column public.tasks.tags is 'Workspace tags shared with docs for filtering';

update public.tasks t
set tags = array_append(t.tags, p.name)
from public.projects p
where t.project_id = p.id
  and coalesce(btrim(p.name), '') <> ''
  and not (p.name = any (t.tags));
