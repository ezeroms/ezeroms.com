-- Notes 編集用に Markdown 原文を保持
alter table public.diary
  add column if not exists body_md text not null default '';

comment on column public.diary.body_md is 'Editor source (Markdown). body_html is the rendered public body.';
