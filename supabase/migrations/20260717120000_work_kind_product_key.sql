-- Work: kind + product_key for Works section pages
alter table public.work
  add column if not exists work_kind text not null default 'commission'
    check (work_kind in ('product', 'commission', 'involvement'));

alter table public.work
  add column if not exists product_key text;

create index if not exists work_kind_idx on public.work (work_kind);
create index if not exists work_product_key_idx on public.work (product_key)
  where product_key is not null;

comment on column public.work.work_kind is 'product | commission | involvement';
comment on column public.work.product_key is 'e.g. chooning — ties entries to a flagship product page';
