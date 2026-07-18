-- Catch-up: columns referenced by admin / public that may be missing
-- (body_md, og_image, work_kind, product_key)

alter table public.diary
  add column if not exists body_md text not null default '';
alter table public.diary
  add column if not exists og_image text not null default '';

alter table public."column"
  add column if not exists og_image text not null default '';

alter table public.work
  add column if not exists og_image text not null default '';
alter table public.work
  add column if not exists work_kind text not null default 'commission';
alter table public.work
  add column if not exists product_key text;

-- Optional CHECK for work_kind (skip if already constrained)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'work_work_kind_check'
  ) then
    alter table public.work
      add constraint work_work_kind_check
      check (work_kind in ('product', 'commission', 'involvement'));
  end if;
exception
  when duplicate_object then null;
end $$;

create index if not exists work_kind_idx on public.work (work_kind);
create index if not exists work_product_key_idx on public.work (product_key)
  where product_key is not null;

comment on column public.diary.body_md is 'Editor source (Markdown). body_html is the rendered public body.';
comment on column public.diary.og_image is 'OGP image URL (recommended 1200×630)';
comment on column public."column".og_image is 'OGP image URL (recommended 1200×630)';
comment on column public.work.og_image is 'OGP image URL (recommended 1200×630); falls back to image_url when empty';
comment on column public.work.work_kind is 'product | commission | involvement';
comment on column public.work.product_key is 'Flagship product hub key, e.g. chooning';
