-- New diary entries default to unpublished (draft).
-- Existing rows are unchanged.
-- Apply:
--   npm run db:apply -- supabase/migrations/20260913110000_diary_default_draft.sql

alter table public.diary
  alter column status set default 'draft';
