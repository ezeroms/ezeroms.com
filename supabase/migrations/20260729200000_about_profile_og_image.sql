-- Me（about_profile）用の OGP 画像

alter table public.about_profile
  add column if not exists og_image text not null default '';

comment on column public.about_profile.og_image is
  'OGP image URL for /about/me/ (recommended 1200×630)';
