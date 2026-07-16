-- Top page random images (managed via admin later)
create table if not exists public.top_image (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  image_url text not null,
  alt text,
  sort_order int not null default 0,
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists top_image_status_idx on public.top_image (status, sort_order);

drop trigger if exists top_image_set_updated_at on public.top_image;
create trigger top_image_set_updated_at
  before update on public.top_image
  for each row execute function public.set_updated_at();

alter table public.top_image enable row level security;
