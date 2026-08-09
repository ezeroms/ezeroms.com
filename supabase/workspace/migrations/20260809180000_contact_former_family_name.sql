-- Add former family name (旧姓) on contacts.
-- Apply:
--   npm run db:apply -- supabase/workspace/migrations/20260809180000_contact_former_family_name.sql

alter table public.contacts
  add column if not exists former_family_name text;

comment on column public.contacts.former_family_name is 'Former / maiden family name (旧姓)';
