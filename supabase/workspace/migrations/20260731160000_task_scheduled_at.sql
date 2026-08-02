-- Task work-block start time (local Workspace DB only; not synced to Google).
--   npm run db:apply -- supabase/workspace/migrations/20260731160000_task_scheduled_at.sql

alter table public.tasks
  add column if not exists scheduled_at timestamptz;

create index if not exists tasks_scheduled_at_idx
  on public.tasks (scheduled_at);

comment on column public.tasks.scheduled_at is
  'Local work-block start. Duration uses estimated_minutes (default 30). Not written to Google Calendar.';
