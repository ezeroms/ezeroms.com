-- Storage bucket for media (images)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read for media bucket
create policy "Public read media"
on storage.objects for select
using (bucket_id = 'media');

-- Writes only via service role (no policy for anon insert)
