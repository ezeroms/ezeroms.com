-- Purchase / source URL for Giants citations (opens in new tab on the public site).
alter table public.shoulders_of_giants
  add column if not exists source_url text;

comment on column public.shoulders_of_giants.source_url is
  'Optional book purchase / source URL. When set, citation text links here in a new tab.';
