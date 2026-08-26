-- Align shoulders_of_giants tags with clip_tag / diary_tag / column_tag / work_tag.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shoulders_of_giants'
      and column_name = 'topic'
  ) then
    alter table public.shoulders_of_giants rename column topic to giants_tag;
  end if;
end $$;

alter index if exists giants_topic_gin rename to giants_tag_gin;
