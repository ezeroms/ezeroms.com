-- Column のジャンル（column_category）は運用していないため削除する。
drop index if exists public.column_category_gin;
alter table public."column" drop column if exists column_category;
