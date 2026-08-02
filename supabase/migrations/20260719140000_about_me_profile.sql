-- About Me structured profile (managed under /admin/about/)

create table if not exists public.about_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'ezeroms',
  sub_name text not null default '',
  bio_md text not null default '',
  bio_html text not null default '',
  cover_image text not null default '/images/about/profile.webp',
  status public.content_status not null default 'published',
  is_deleted boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists about_profile_active_idx
  on public.about_profile (status)
  where is_deleted = false;

drop trigger if exists about_profile_set_updated_at on public.about_profile;
create trigger about_profile_set_updated_at
  before update on public.about_profile
  for each row execute function public.set_updated_at();

alter table public.about_profile enable row level security;

comment on table public.about_profile is 'Singleton-ish Me profile (name, sub_name, bio)';
comment on column public.about_profile.name is 'Primary display name (h1), e.g. ezeroms';
comment on column public.about_profile.sub_name is 'Secondary name under h1, e.g. イワモトユウ';

create table if not exists public.about_favorite (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists about_favorite_sort_idx
  on public.about_favorite (sort_order)
  where is_deleted = false;

drop trigger if exists about_favorite_set_updated_at on public.about_favorite;
create trigger about_favorite_set_updated_at
  before update on public.about_favorite
  for each row execute function public.set_updated_at();

alter table public.about_favorite enable row level security;

create table if not exists public.about_based_in (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  body_md text not null default '',
  body_html text not null default '',
  sort_order int not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists about_based_in_sort_idx
  on public.about_based_in (sort_order)
  where is_deleted = false;

drop trigger if exists about_based_in_set_updated_at on public.about_based_in;
create trigger about_based_in_set_updated_at
  before update on public.about_based_in
  for each row execute function public.set_updated_at();

alter table public.about_based_in enable row level security;

create table if not exists public.about_web_link (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  sort_order int not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists about_web_link_sort_idx
  on public.about_web_link (sort_order)
  where is_deleted = false;

drop trigger if exists about_web_link_set_updated_at on public.about_web_link;
create trigger about_web_link_set_updated_at
  before update on public.about_web_link
  for each row execute function public.set_updated_at();

alter table public.about_web_link enable row level security;

-- Seed only when empty (idempotent)
insert into public.about_profile (
  name, sub_name, bio_md, bio_html, cover_image, status, published_at
)
select
  'ezeroms',
  'イワモトユウ',
  $md$1989年生まれ、横須賀市出身。Webサービスやスマートフォンアプリのデザイン、開発を行っています。

これまでに、オンラインサロン・プラットフォーム「Synapse」や、オンライン商談システム「[bellFace](https://bell-face.com/)」などを手がけてきました。最近は、音楽への思いを記録する「[Chooning](https://hello.chooning.app/)」、人事評価制度を支える「[Cateras](https://www.ashita-team.com/cateras/)」などのプロダクトを作っています。

このサイトでは、僕が日々触れている出来事や、そこで考えたことを記録しています。思いつきのメモから、じっくり調べた記録まで、いろいろなものが混ざっていますが、どこかで誰かの視界が広がるきっかけになれば嬉しいです。$md$,
  $html$<p>1989年生まれ、横須賀市出身。Webサービスやスマートフォンアプリのデザイン、開発を行っています。</p>
<p>これまでに、オンラインサロン・プラットフォーム「Synapse」や、オンライン商談システム「<a href="https://bell-face.com/">bellFace</a>」などを手がけてきました。最近は、音楽への思いを記録する「<a href="https://hello.chooning.app/">Chooning</a>」、人事評価制度を支える「<a href="https://www.ashita-team.com/cateras/">Cateras</a>」などのプロダクトを作っています。</p>
<p>このサイトでは、僕が日々触れている出来事や、そこで考えたことを記録しています。思いつきのメモから、じっくり調べた記録まで、いろいろなものが混ざっていますが、どこかで誰かの視界が広がるきっかけになれば嬉しいです。</p>$html$,
  '/images/about/profile.webp',
  'published',
  now()
where not exists (
  select 1 from public.about_profile where is_deleted = false
);

insert into public.about_favorite (label, sort_order)
select v.label, v.sort_order
from (values
  ('デザイン', 0),
  ('インターネット', 1),
  ('ポピュラー音楽', 2),
  ('楽器の演奏', 3),
  ('散歩', 4),
  ('麻雀', 5),
  ('野菜', 6),
  ('花', 7),
  ('果物', 8)
) as v(label, sort_order)
where not exists (select 1 from public.about_favorite where is_deleted = false);

insert into public.about_based_in (location, body_md, body_html, sort_order)
select v.location, v.body_md, v.body_html, v.sort_order
from (values
  (
    '高円寺',
    '住んでいます。「[小杉湯となり](https://kosugiyu-tonari.com/)」で仕事してます。',
    '住んでいます。「<a href="https://kosugiyu-tonari.com/">小杉湯となり</a>」で仕事してます。',
    0
  ),
  (
    '横浜',
    '20代から30代にかけて、15年ほど生活していました。僕が経営するチューニング株式会社は、関内の[泰生ビル](https://taiyusha.co.jp/base/taisei/)にオフィスがあります。',
    '20代から30代にかけて、15年ほど生活していました。僕が経営するチューニング株式会社は、関内の<a href="https://taiyusha.co.jp/base/taisei/">泰生ビル</a>にオフィスがあります。',
    1
  ),
  (
    '佐渡島',
    '[岩首](https://maps.app.goo.gl/kBmej4aTK9oXvmCh9)という村に10年以上通い続けています。年3〜4回ほど島に渡り、田植えやお祭りに参加しています。',
    '<a href="https://maps.app.goo.gl/kBmej4aTK9oXvmCh9">岩首</a>という村に10年以上通い続けています。年3〜4回ほど島に渡り、田植えやお祭りに参加しています。',
    2
  ),
  (
    '台湾',
    '冬の間（1月〜4月）は暖かい地域で越冬しています。台北や新北に滞在していることが多いです。',
    '冬の間（1月〜4月）は暖かい地域で越冬しています。台北や新北に滞在していることが多いです。',
    3
  )
) as v(location, body_md, body_html, sort_order)
where not exists (select 1 from public.about_based_in where is_deleted = false);

insert into public.about_web_link (label, url, sort_order)
select v.label, v.url, v.sort_order
from (values
  ('BeReal', 'https://bere.al/ezeroms', 0),
  ('Bluesky', 'https://bsky.app/profile/ezeroms.bsky.social', 1),
  ('Chooning', 'https://chooning.app/@ezeroms/?hl=ja', 2),
  ('Discord', 'https://discord.gg/prmzctxtRe', 3),
  ('Duolingo', 'https://www.duolingo.com/profile/ezeroms', 4),
  ('Facebook', 'https://www.facebook.com/ezeroms/', 5),
  ('Instagram', 'https://www.instagram.com/ezeroms/', 6),
  ('LINE', 'https://line.me/ti/p/Aj7KkTC6Fo', 7),
  ('Messenger', 'https://m.me/ezeroms', 8),
  ('Signal', 'https://signal.me/#eu/b86kR2YSALTBmAF7MhH5DPm3ipGWm75xKfK6BbCQ-MyJ92vspUhKeYvBm3yXzw1C', 9),
  ('Spotify', 'https://open.spotify.com/user/ezeroms', 10),
  ('Threads', 'https://www.threads.net/@ezeroms', 11),
  ('TikTok', 'https://www.tiktok.com/@ezeroms', 12),
  ('WhatsApp', 'https://wa.me/qr/36R6ZQFFCIUBP1', 13),
  ('X (Twitter)', 'https://x.com/ezeroms', 14)
) as v(label, url, sort_order)
where not exists (select 1 from public.about_web_link where is_deleted = false);
