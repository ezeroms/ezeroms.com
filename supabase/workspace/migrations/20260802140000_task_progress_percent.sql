-- Task 進捗（0–100%）。

alter table public.tasks
  add column if not exists progress_percent integer not null default 0;

alter table public.tasks
  drop constraint if exists tasks_progress_percent_check;

alter table public.tasks
  add constraint tasks_progress_percent_check
  check (progress_percent >= 0 and progress_percent <= 100);
