-- Migrate placeholder birth year 1900 → sentinel year 0001 (BIRTHDAY_UNKNOWN_YEAR).
-- Keeps month/day; forces birthday_year_known = false.
-- Apply:
--   npm run db:apply:workspace -- supabase/workspace/migrations/20260809170000_birthday_sentinel_year.sql

update public.contacts
set
  birthday = make_date(
    1,
    extract(month from birthday)::int,
    extract(day from birthday)::int
  ),
  birthday_year_known = false,
  updated_at = now()
where birthday is not null
  and extract(year from birthday)::int = 1900;
