# Supabase スキーマ

マイグレーション: [`supabase/migrations/`](../supabase/migrations/)

| テーブル | 用途 |
|----------|------|
| about | About ページ |
| media_coverage | メディア掲載 |
| diary | Diary |
| column | Column（予約語のため quote） |
| work | Work |
| shoulders_of_giants | Giants |
| snap | Snap |
| chronicle | Chronicle（年表 API の対象） |
| ui_design_guidebook | UI Design Guidebook |
| top_image | トップページのランダム画像（Storage URL） |

共通: `slug` unique, `status` (`draft`/`published`/`archived`), `body_html`, timestamps。

RLS 有効・anon 向け policy なし → **service role の自前 API のみ**が読む。

Storage: bucket `media`（公開読取）。トップ画像は `media/top/{filename}`。

### top_image

| カラム | 説明 |
|--------|------|
| slug | ファイル名ベースの一意キー |
| image_url | Storage 公開 URL |
| alt | 代替テキスト |
| sort_order | 管理用並び |
| status | published のみ表示 |

移行: `npm run migrate:top-images`（事前に `20260717010000_top_image.sql` と Storage bucket を適用）

API:
- `GET /api/top-image` — 公開中から1枚ランダム
- `GET /api/top-images` — 一覧
