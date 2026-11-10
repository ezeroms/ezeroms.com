-- Short note shown beside the place and year on the homepage.

alter table public.top_image
  add column if not exists message text;

comment on column public.top_image.message is
  'Optional line shown to the right of the place and year (e.g. Tokyo, 2026)';
