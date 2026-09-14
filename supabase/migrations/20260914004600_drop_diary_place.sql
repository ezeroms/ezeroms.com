-- Diary の場所（diary_place）は運用しないため削除する。
alter table public.diary drop column if exists diary_place;
