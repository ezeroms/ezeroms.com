-- Soft delete flag for Writing content tables (Notes / Column / Works)

alter table public.diary
  add column if not exists is_deleted boolean not null default false;

alter table public."column"
  add column if not exists is_deleted boolean not null default false;

alter table public.work
  add column if not exists is_deleted boolean not null default false;

create index if not exists diary_is_deleted_idx on public.diary (is_deleted)
  where is_deleted = false;
create index if not exists column_is_deleted_idx on public."column" (is_deleted)
  where is_deleted = false;
create index if not exists work_is_deleted_idx on public.work (is_deleted)
  where is_deleted = false;
