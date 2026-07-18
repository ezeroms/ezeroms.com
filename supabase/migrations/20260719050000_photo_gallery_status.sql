-- photo_gallery: public / private page status

alter table public.photo_gallery
  add column if not exists status text not null default 'published'
    check (status in ('published', 'private'));

comment on column public.photo_gallery.status is
  'published = public site; private = hidden from nav and 404 on public URLs';

update public.photo_gallery
set status = 'published'
where status is null or status = '';
