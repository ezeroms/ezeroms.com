-- Photo soft delete: is_deleted flag (論理削除)
-- smile / jumpai / kuikake / legacy snap

alter table public.smile
  add column if not exists is_deleted boolean not null default false;

alter table public.jumpai
  add column if not exists is_deleted boolean not null default false;

alter table public.kuikake
  add column if not exists is_deleted boolean not null default false;

-- 旧 snap（smile フォールバック用）にも同様に付与
do $$
begin
  if to_regclass('public.snap') is not null then
    alter table public.snap
      add column if not exists is_deleted boolean not null default false;
  end if;
end $$;

create index if not exists smile_is_deleted_idx on public.smile (is_deleted)
  where is_deleted = false;
create index if not exists jumpai_is_deleted_idx on public.jumpai (is_deleted)
  where is_deleted = false;
create index if not exists kuikake_is_deleted_idx on public.kuikake (is_deleted)
  where is_deleted = false;
