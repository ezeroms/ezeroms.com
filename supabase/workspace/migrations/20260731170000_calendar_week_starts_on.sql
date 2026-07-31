-- Week start preference for Workspace Calendar (Monday or Sunday).
--   npm run db:apply -- supabase/workspace/migrations/20260731170000_calendar_week_starts_on.sql

alter table public.calendar_preferences
  add column if not exists week_starts_on text not null default 'monday'
    check (week_starts_on in ('monday', 'sunday'));

comment on column public.calendar_preferences.week_starts_on is
  'First day of week in Calendar UI: monday | sunday. Default monday.';
