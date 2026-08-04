-- Friends → Contacts (+ phones / addresses / links / employments).
-- Apply:
--   npm run db:apply:workspace -- supabase/workspace/migrations/20260804140000_contacts.sql
--
-- Security: RLS enabled with no anon/authenticated policies.
-- Access only via server service_role after admin session checks.

-- ---------------------------------------------------------------------------
-- Rename friends → contacts
-- ---------------------------------------------------------------------------
alter table if exists public.friends rename to contacts;

-- Add is_friend as nullable first so a one-time backfill can mark legacy rows.
alter table public.contacts
  add column if not exists is_friend boolean;

alter table public.contacts
  add column if not exists tags text[] not null default '{}';

-- Existing people were Friends; only fill rows that have never been set.
update public.contacts set is_friend = true where is_friend is null;

alter table public.contacts
  alter column is_friend set default false;

alter table public.contacts
  alter column is_friend set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'friends_has_identity'
      and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts rename constraint friends_has_identity to contacts_has_identity;
  end if;
end $$;

drop trigger if exists friends_set_updated_at on public.contacts;
drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

drop index if exists friends_deleted_at_idx;
drop index if exists friends_updated_at_idx;
drop index if exists friends_family_name_idx;
drop index if exists friends_given_name_idx;

create index if not exists contacts_deleted_at_idx on public.contacts (deleted_at);
create index if not exists contacts_updated_at_idx on public.contacts (updated_at desc);
create index if not exists contacts_family_name_idx on public.contacts (family_name);
create index if not exists contacts_given_name_idx on public.contacts (given_name);
create index if not exists contacts_is_friend_idx on public.contacts (is_friend) where deleted_at is null;
create index if not exists contacts_tags_gin_idx on public.contacts using gin (tags);

comment on table public.contacts is 'Workspace contacts (people directory; Friends = is_friend)';

-- ---------------------------------------------------------------------------
-- Rename activity_friends → activity_contacts
-- ---------------------------------------------------------------------------
alter table if exists public.activity_friends rename to activity_contacts;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_contacts'
      and column_name = 'friend_id'
  ) then
    alter table public.activity_contacts rename column friend_id to contact_id;
  end if;
end $$;

drop index if exists activity_friends_friend_id_idx;
create index if not exists activity_contacts_contact_id_idx
  on public.activity_contacts (contact_id);

comment on table public.activity_contacts is 'Contacts linked to an activity';

-- ---------------------------------------------------------------------------
-- contact_phones
-- ---------------------------------------------------------------------------
create table if not exists public.contact_phones (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  label text,
  value text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_phones_value_nonempty check (nullif(btrim(value), '') is not null)
);

drop trigger if exists contact_phones_set_updated_at on public.contact_phones;
create trigger contact_phones_set_updated_at
  before update on public.contact_phones
  for each row execute function public.set_updated_at();

alter table public.contact_phones enable row level security;

create index if not exists contact_phones_contact_id_idx
  on public.contact_phones (contact_id, sort_order);

-- ---------------------------------------------------------------------------
-- contact_addresses
-- ---------------------------------------------------------------------------
create table if not exists public.contact_addresses (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  label text,
  value text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_addresses_value_nonempty check (nullif(btrim(value), '') is not null)
);

drop trigger if exists contact_addresses_set_updated_at on public.contact_addresses;
create trigger contact_addresses_set_updated_at
  before update on public.contact_addresses
  for each row execute function public.set_updated_at();

alter table public.contact_addresses enable row level security;

create index if not exists contact_addresses_contact_id_idx
  on public.contact_addresses (contact_id, sort_order);

-- ---------------------------------------------------------------------------
-- contact_links
-- ---------------------------------------------------------------------------
create table if not exists public.contact_links (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  label text,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_links_url_nonempty check (nullif(btrim(url), '') is not null)
);

drop trigger if exists contact_links_set_updated_at on public.contact_links;
create trigger contact_links_set_updated_at
  before update on public.contact_links
  for each row execute function public.set_updated_at();

alter table public.contact_links enable row level security;

create index if not exists contact_links_contact_id_idx
  on public.contact_links (contact_id, sort_order);

-- ---------------------------------------------------------------------------
-- contact_employments (company / title history; one current)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_employments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  company_name text not null,
  title text,
  started_on date,
  ended_on date,
  is_current boolean not null default false,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_employments_company_nonempty
    check (nullif(btrim(company_name), '') is not null)
);

drop trigger if exists contact_employments_set_updated_at on public.contact_employments;
create trigger contact_employments_set_updated_at
  before update on public.contact_employments
  for each row execute function public.set_updated_at();

alter table public.contact_employments enable row level security;

create index if not exists contact_employments_contact_id_idx
  on public.contact_employments (contact_id, sort_order);

-- At most one current employment per contact.
create unique index if not exists contact_employments_one_current_idx
  on public.contact_employments (contact_id)
  where is_current;

comment on table public.contact_phones is 'Contact phone numbers (optional label)';
comment on table public.contact_addresses is 'Contact addresses (optional label)';
comment on table public.contact_links is 'Contact related URLs / SNS (optional label)';
comment on table public.contact_employments is 'Contact employment history; is_current marks the primary display row';
