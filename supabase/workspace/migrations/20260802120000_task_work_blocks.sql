-- Task の複数「作業枠」（ローカルタイムライン用）。
-- Google 連携がある場合は calendar_links を任意で参照する。
-- Security: RLS enabled with no anon/authenticated policies.

create table if not exists public.task_work_blocks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  calendar_link_id uuid references public.calendar_links (id) on delete set null,
  note_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_work_blocks_range check (ends_at > starts_at)
);

create index if not exists task_work_blocks_task_id_idx
  on public.task_work_blocks (task_id);

create index if not exists task_work_blocks_starts_at_idx
  on public.task_work_blocks (starts_at);

create index if not exists task_work_blocks_range_idx
  on public.task_work_blocks (starts_at, ends_at);

create unique index if not exists task_work_blocks_calendar_link_id_uidx
  on public.task_work_blocks (calendar_link_id)
  where calendar_link_id is not null;

alter table public.task_work_blocks enable row level security;

drop trigger if exists task_work_blocks_set_updated_at on public.task_work_blocks;
create trigger task_work_blocks_set_updated_at
  before update on public.task_work_blocks
  for each row execute function public.set_updated_at();

insert into public.task_work_blocks (task_id, starts_at, ends_at)
select
  t.id,
  t.scheduled_at,
  t.scheduled_at
    + (coalesce(nullif(t.estimated_minutes, 0), 30) || ' minutes')::interval
from public.tasks t
where t.scheduled_at is not null
  and not exists (
    select 1 from public.task_work_blocks b where b.task_id = t.id
  );
