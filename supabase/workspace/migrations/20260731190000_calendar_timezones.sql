-- Primary / secondary timezones for Workspace Calendar dual time axis.
--   npm run db:apply -- supabase/workspace/migrations/20260731190000_calendar_timezones.sql

alter table public.calendar_preferences
  add column if not exists primary_timezone text not null default 'Asia/Tokyo',
  add column if not exists primary_timezone_label text not null default 'Tokyo',
  add column if not exists secondary_timezone_enabled boolean not null default false,
  add column if not exists secondary_timezone text not null default 'Asia/Taipei',
  add column if not exists secondary_timezone_label text not null default 'Taipei';

comment on column public.calendar_preferences.primary_timezone is
  'IANA timezone for the calendar grid (primary time axis).';
comment on column public.calendar_preferences.primary_timezone_label is
  'Short label shown above the primary time axis.';
comment on column public.calendar_preferences.secondary_timezone_enabled is
  'When true, show a second time axis beside the primary.';
comment on column public.calendar_preferences.secondary_timezone is
  'IANA timezone for the secondary time axis.';
comment on column public.calendar_preferences.secondary_timezone_label is
  'Short label shown above the secondary time axis.';
