# 環境変数セットアップ（Supabase）

## 1. ファイル

```bash
cp .env.example .env.local
```

既存の Contentful 用 `.env` がある場合は `CONTENTFUL_*` を転記してよい（移行用）。

## 2. Supabase

1. https://supabase.com でプロジェクト作成
2. **Project Settings → API**
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`（管理画面ログイン用）
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`（**公開しない**）
3. **SQL Editor** で次を順に実行
   - [`supabase/migrations/20260716120000_init_content_schema.sql`](supabase/migrations/20260716120000_init_content_schema.sql)
   - [`supabase/migrations/20260716120001_fix_triggers_rls.sql`](supabase/migrations/20260716120001_fix_triggers_rls.sql)（必要なら）
   - [`supabase/migrations/20260716120100_storage_media.sql`](supabase/migrations/20260716120100_storage_media.sql)
   - [`supabase/migrations/20260717010000_top_image.sql`](supabase/migrations/20260717010000_top_image.sql)
   - [`supabase/migrations/20260717020000_diary_body_md.sql`](supabase/migrations/20260717020000_diary_body_md.sql)（Notes 編集用）
   - [`supabase/migrations/20260717030000_clip.sql`](supabase/migrations/20260717030000_clip.sql)（Clips）
4. トップ画像を Storage + DB へ投入
   ```bash
   npm run migrate:top-images
   ```
5. **管理ユーザー作成**（Supabase Auth）
   ```bash
   npm run admin:create-user -- you@example.com 'your-password'
   ```
   または Dashboard → Authentication → Users → Add user  
   Authentication → Providers で Email を有効に。公開サインアップはオフ推奨。

## 3. その他

```bash
# ISR 用（未設定なら生成）
openssl rand -hex 32   # → REVALIDATE_SECRET

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. 確認

```bash
npm install
npm run migrate:supabase
npm run dev
```

## Vercel に載せる変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVALIDATE_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://ezeroms.com`

`CONTENTFUL_*` / `VERCEL_TOKEN` は本番に不要。

## 管理画面

- ログイン: `/admin/login/`
- ダッシュボード: `/admin/`（サイドバー付きシェル）
- Notes: `/admin/notes/` · `/admin/notes/new/`
- Clips: `/admin/clips/` · `/admin/clips/new/`
- その他（Column / Work / Snap / Top images / Giants / Chronicle / About / Media coverage）は枠のみ（Soon）

ナビ定義: `src/lib/admin/nav.ts`

## スタイル

- 新 UI: Tailwind + [`src/styles/design-tokens.css`](src/styles/design-tokens.css) + [`src/components/ui/`](src/components/ui/)
- 旧公開サイト CSS: [`src/styles/legacy/`](src/styles/legacy/)（移行完了まで残す。中身は極力触らない）
- 追加コンポーネント: `npx shadcn@latest add <name>`（`components.json` 参照）
