-- Lightweight grid thumbnails for photo galleries.
-- image_url = original; image_thumb_url = resized/WebP for list display.

alter table public.smile
  add column if not exists image_thumb_url text;

alter table public.jumpai
  add column if not exists image_thumb_url text;

alter table public.kuikake
  add column if not exists image_thumb_url text;

comment on column public.smile.image_thumb_url is
  'Resized WebP for gallery grids; lightbox uses image_url (original).';
comment on column public.jumpai.image_thumb_url is
  'Resized WebP for gallery grids; lightbox uses image_url (original).';
comment on column public.kuikake.image_thumb_url is
  'Resized WebP for gallery grids; lightbox uses image_url (original).';
