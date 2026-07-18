-- Chronicle: date precision (year/month/day) and optional end date for periods
alter table public.chronicle
  add column if not exists date_precision text not null default 'day'
    check (date_precision in ('year', 'month', 'day'));

alter table public.chronicle
  add column if not exists end_date date;

comment on column public.chronicle.date_precision is
  'Display precision for date: year | month | day';
comment on column public.chronicle.end_date is
  'Optional end of a date range; when set, event is treated as a period';
