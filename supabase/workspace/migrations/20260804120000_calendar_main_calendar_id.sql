-- Main calendar for dashboard / workload meeting hours (one calendar).
alter table public.calendar_preferences
  add column if not exists main_calendar_id text;

comment on column public.calendar_preferences.main_calendar_id is
  'Google calendar id used for dashboard today events and meeting-load calculations. Null = fall back to Google primary.';
