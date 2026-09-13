-- Merge activities.what_md into notes_md, then drop what_md.
-- "何をしたか" and "どんな話をしたか" become a single memo field.
-- Apply:
--   npm run db:apply:workspace -- supabase/workspace/migrations/20260913103000_activities_merge_memo.sql

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activities'
      and column_name = 'what_md'
  ) then
    update public.activities
    set notes_md = case
      when nullif(btrim(coalesce(what_md, '')), '') is null
        then notes_md
      when nullif(btrim(coalesce(notes_md, '')), '') is null
        then btrim(what_md)
      when btrim(what_md) = btrim(notes_md)
        then notes_md
      else btrim(what_md) || E'\n\n' || btrim(notes_md)
    end;

    alter table public.activities drop column what_md;
  end if;
end $$;

comment on column public.activities.notes_md is
  'Activity memo (what happened, conversation notes, etc.)';
