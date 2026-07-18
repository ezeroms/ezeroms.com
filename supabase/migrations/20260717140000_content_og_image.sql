-- Dedicated OGP image (1200×630 / 1.91:1) for article-like content.
-- Clips already have og_image; photos use image_url as the primary asset.

alter table public.diary
  add column if not exists og_image text not null default '';

alter table public."column"
  add column if not exists og_image text not null default '';

alter table public.work
  add column if not exists og_image text not null default '';

alter table public.shoulders_of_giants
  add column if not exists og_image text not null default '';

alter table public.chronicle
  add column if not exists og_image text not null default '';

alter table public.about
  add column if not exists og_image text not null default '';

alter table public.media_coverage
  add column if not exists og_image text not null default '';

alter table public.ui_design_guidebook
  add column if not exists og_image text not null default '';

alter table public.experience
  add column if not exists og_image text not null default '';

comment on column public.diary.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public."column".og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.work.og_image is 'OGP image URL (recommended 1200×630); falls back to image_url when empty';
comment on column public.shoulders_of_giants.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.chronicle.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.about.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.media_coverage.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.ui_design_guidebook.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.experience.og_image is 'OGP image URL (recommended 1200×630)';
