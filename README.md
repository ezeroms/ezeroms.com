# ezeroms.com

個人サイト [ezeroms.com](https://ezeroms.com)。  
**Next.js + Supabase + Vercel** へ移行中（旧 Hugo / Contentful / Netlify）。

## スタック

- フロント: Next.js (App Router)
- DB / Storage: Supabase (PostgreSQL)
- 通信: 自前 API（Route Handlers）。ブラウザは Supabase を直接叩かない
- 記事: ISR / 年表・検索: API fetch（アプリ型）

## セットアップ

1. [Supabase](https://supabase.com) でプロジェクト作成
2. SQL Editor で [`supabase/migrations/`](supabase/migrations/) を上から順に実行
3. `cp .env.example .env.local` し値を埋める（[`ENV_SETUP.md`](ENV_SETUP.md)）
4. `npm install && npm run dev`
5. コンテンツ投入: `npm run migrate:supabase`

## 環境変数

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー・移行のみ（秘匿） |
| `REVALIDATE_SECRET` | ISR 再検証 `/api/revalidate` |
| `NEXT_PUBLIC_SITE_URL` | サイト URL |
| `CONTENTFUL_*` | 移行時のみ（任意） |

## 主な API

| Path | 用途 |
|------|------|
| `GET /api/diary` | Diary 一覧 |
| `GET /api/chronicle?start=&end=&tags=` | 年表（都度取得・no-store） |
| `GET /api/search?q=` | 横断検索 |
| `POST /api/revalidate?secret=` | ISR 再検証 |
| `GET /api/admin` | 管理 API スタブ（Bearer secret） |

## 管理画面

`/admin` はプレースホルダ。本実装は後続（Supabase Auth + CRUD）。

## 切替（本番）

1. Vercel にリポを連携し、上記環境変数を登録
2. Preview 確認後、DNS を Vercel へ
3. Netlify / Hugo ビルド / Contentful Webhook を停止
4. 安定後に `layouts/`・`content/` 等の Hugo 資産を削除可

詳細スキーマ: [`docs/supabase-schema.md`](docs/supabase-schema.md)
