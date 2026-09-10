-- Inbox is no longer a task status. Untagged tasks are Inbox in the UI.
-- Existing inbox rows become active.
-- Apply:
--   npm run db:apply:workspace -- supabase/workspace/migrations/20260909153000_tasks_drop_inbox_status.sql

update public.tasks
set status = 'active'
where status = 'inbox';

alter table public.tasks
  alter column status set default 'active';

alter table public.tasks
  drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('active', 'waiting', 'done', 'archived'));
