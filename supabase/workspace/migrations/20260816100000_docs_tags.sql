-- Docs tags (text[]). Project は DB 上残し、フロントでは使わない。
-- Apply:
--   npm run db:apply:workspace -- supabase/workspace/migrations/20260816100000_docs_tags.sql

alter table public.docs
  add column if not exists tags text[] not null default '{}';

create index if not exists docs_tags_gin_idx on public.docs using gin (tags);

comment on column public.docs.tags is 'Workspace doc tags for sidebar filtering';
