-- Clips テーブル作成 + テスト投稿（Supabase SQL Editor で一括実行）

create table if not exists public.clip (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_url text not null,
  date timestamptz not null default now(),
  memo text not null default '',
  clip_tag text[] not null default '{}',
  og_image text not null default '',
  og_description text not null default '',
  status public.content_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clip
  add column if not exists og_image text not null default '',
  add column if not exists og_description text not null default '';

create index if not exists clip_date_idx on public.clip (date desc);
create index if not exists clip_tag_gin on public.clip using gin (clip_tag);

drop trigger if exists clip_set_updated_at on public.clip;
create trigger clip_set_updated_at
  before update on public.clip
  for each row execute function public.set_updated_at();

alter table public.clip enable row level security;

insert into public.clip (slug, title, source_url, date, memo, clip_tag, status, published_at)
values
  (
    'clip-test-openai-o3',
    'OpenAI announces o3 and o4-mini',
    'https://openai.com/index/introducing-o3-and-o4-mini/',
    '2025-04-16T10:00:00+09:00',
    '推論モデルの次の一手。コストと速度のバランスが実務でどう効くかを見たい。',
    array['AI', 'OpenAI'],
    'published',
    '2025-04-16T10:00:00+09:00'
  ),
  (
    'clip-test-vercel-fluid',
    'Fluid compute on Vercel',
    'https://vercel.com/blog/fluid-compute',
    '2025-03-01T12:00:00+09:00',
    'サーバーレスの課金・スケールの話。個人サイトでも意識しておくと安心。',
    array['インフラ', 'Vercel'],
    'published',
    '2025-03-01T12:00:00+09:00'
  ),
  (
    'clip-test-nytimes-design',
    'How The New York Times designs for trust',
    'https://www.nytimes.com/',
    '2025-11-20T09:30:00+09:00',
    '出典の信頼性・タイポ・余白。Clips のカード設計の参考メモ。',
    array['デザイン', 'メディア'],
    'published',
    '2025-11-20T09:30:00+09:00'
  ),
  (
    'clip-test-mdn-popover',
    'Popover API - MDN',
    'https://developer.mozilla.org/en-US/docs/Web/API/Popover_API',
    '2026-01-08T18:00:00+09:00',
    'ネイティブ popover。管理画面のユーザーメニューにも使えそう。',
    array['Web', 'フロントエンド'],
    'published',
    '2026-01-08T18:00:00+09:00'
  ),
  (
    'clip-test-draft-sample',
    '（下書き）あとで読む候補',
    'https://example.com/article',
    '2026-07-16T22:00:00+09:00',
    '公開前の下書きテスト。公開一覧には出ない想定。',
    array['テスト'],
    'draft',
    null
  )
on conflict (slug) do update set
  title = excluded.title,
  source_url = excluded.source_url,
  date = excluded.date,
  memo = excluded.memo,
  clip_tag = excluded.clip_tag,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();
