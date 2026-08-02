-- Top images: location / year for homepage overlay + soft delete

alter table public.top_image
  add column if not exists location text;

alter table public.top_image
  add column if not exists captured_year int;

alter table public.top_image
  add column if not exists is_deleted boolean not null default false;

create index if not exists top_image_is_deleted_idx
  on public.top_image (is_deleted)
  where is_deleted = false;

comment on column public.top_image.location is
  'Place label shown at bottom-right of the homepage image (e.g. Sado)';
comment on column public.top_image.captured_year is
  'Year shown with location on the homepage (e.g. 2013)';
comment on column public.top_image.is_deleted is
  'Soft delete flag; hidden from admin list and public random picker';

-- Backfill from alt captions like "Sado, 2013" when columns are empty
update public.top_image
set
  location = coalesce(
    nullif(trim(location), ''),
    nullif(trim(substring(alt from '^(.+?),\s*\d{4}$')), '')
  ),
  captured_year = coalesce(
    captured_year,
    nullif(substring(alt from ',\s*(\d{4})$'), '')::int
  )
where (location is null or captured_year is null)
  and alt ~ '^.+,\s*\d{4}$';
