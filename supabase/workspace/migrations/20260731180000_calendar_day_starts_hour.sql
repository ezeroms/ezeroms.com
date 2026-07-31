-- Day start hour for Workspace Calendar time grid (0–23).
--   npm run db:apply -- supabase/workspace/migrations/20260731180000_calendar_day_starts_hour.sql

alter table public.calendar_preferences
  add column if not exists day_starts_hour integer not null default 0
    check (day_starts_hour >= 0 and day_starts_hour <= 23);

comment on column public.calendar_preferences.day_starts_hour is
  'Hour (0–23) at the top of the week/day time grid. Default 0 (midnight).';
