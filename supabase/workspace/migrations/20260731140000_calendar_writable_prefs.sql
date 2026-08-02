-- Writable Google Calendar preference for Task work blocks.
--   npm run db:apply -- supabase/workspace/migrations/20260731140000_calendar_writable_prefs.sql

alter table public.calendar_preferences
  add column if not exists writable_calendar_id text;

comment on column public.calendar_preferences.writable_calendar_id is
  'Google calendar ID used for Workspace-created task work blocks. Must be owner/writer.';
