-- Catch-up: about.og_image (from 20260717140000) may be missing on some envs

alter table public.about
  add column if not exists og_image text not null default '';

comment on column public.about.og_image is 'OGP image URL (recommended 1200×630)';
