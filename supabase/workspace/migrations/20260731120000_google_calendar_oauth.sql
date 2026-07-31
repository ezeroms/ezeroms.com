-- Google Calendar OAuth tokens + display preferences (Workspace).
-- Tokens are server-only (RLS on, no anon policies). Never expose via public APIs.
--   npm run db:apply -- supabase/workspace/migrations/20260731120000_google_calendar_oauth.sql

create table if not exists public.google_oauth_tokens (
  id text primary key
    check (id = 'default'),
  google_email text,
  access_token text not null,
  refresh_token text,
  scope text,
  token_type text,
  expiry_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists google_oauth_tokens_set_updated_at on public.google_oauth_tokens;
create trigger google_oauth_tokens_set_updated_at
  before update on public.google_oauth_tokens
  for each row execute function public.set_updated_at();

alter table public.google_oauth_tokens enable row level security;

create table if not exists public.calendar_preferences (
  id text primary key
    check (id = 'default'),
  hidden_calendar_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists calendar_preferences_set_updated_at on public.calendar_preferences;
create trigger calendar_preferences_set_updated_at
  before update on public.calendar_preferences
  for each row execute function public.set_updated_at();

alter table public.calendar_preferences enable row level security;

insert into public.calendar_preferences (id) values ('default')
on conflict (id) do nothing;

comment on table public.google_oauth_tokens is
  'Singleton Google OAuth tokens for Workspace Calendar (read-only initially). Server-only.';
comment on table public.calendar_preferences is
  'Workspace Calendar UI preferences (hidden calendar IDs).';
