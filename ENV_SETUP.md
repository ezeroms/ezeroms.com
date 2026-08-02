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
3. **Account → Access Tokens** で Personal Access Token を発行 → `SUPABASE_ACCESS_TOKEN`（`npm run db:apply` 用。Vercel には不要）
4. **SQL Editor** で次を順に実行
   - [`supabase/migrations/20260716120000_init_content_schema.sql`](supabase/migrations/20260716120000_init_content_schema.sql)
   - [`supabase/migrations/20260716120001_fix_triggers_rls.sql`](supabase/migrations/20260716120001_fix_triggers_rls.sql)（必要なら）
   - [`supabase/migrations/20260716120100_storage_media.sql`](supabase/migrations/20260716120100_storage_media.sql)
   - [`supabase/migrations/20260717010000_top_image.sql`](supabase/migrations/20260717010000_top_image.sql)
   - [`supabase/migrations/20260717020000_diary_body_md.sql`](supabase/migrations/20260717020000_diary_body_md.sql)（Notes 編集用）
   - [`supabase/migrations/20260717030000_clip.sql`](supabase/migrations/20260717030000_clip.sql)（Clips）
5. トップ画像を Storage + DB へ投入
   ```bash
   npm run migrate:top-images
   ```
6. **管理ユーザー作成**（Supabase Auth）
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

## Workspace（管理画面の Docs / Tasks など）

**既定はサイトと同じ Supabase プロジェクト**。テーブルは RLS 有効・anon ポリシーなし、アクセスはサーバーの service role + 管理者セッションのみ。

1. migration を既存プロジェクトへ適用
   ```bash
   npm run db:apply -- supabase/workspace/migrations/20260731100000_workspace_init.sql
   ```
   または SQL Editor で同ファイルを実行。
2. 追加の環境変数は不要（既存の `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を利用）。
3. 将来プロジェクトを分ける場合のみ `WORKSPACE_SUPABASE_URL` / `WORKSPACE_SUPABASE_SERVICE_ROLE_KEY` を設定。

公開サイトのクエリや検索 API から Workspace テーブルを参照しないこと。

## Google Calendar（Workspace）

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成（または既存）
2. **API とサービス → ライブラリ** で **Google Calendar API** を有効化
3. **OAuth 同意画面** を設定（外部 / テストユーザーに自分の Google アカウントを追加）
4. **認証情報 → OAuth 2.0 クライアント ID**（ウェブアプリケーション）
   - 承認済みのリダイレクト URI:
     - `http://localhost:3000/api/admin/workspace/calendar/oauth/callback/`
     - `https://ezeroms.com/api/admin/workspace/calendar/oauth/callback/`
5. `.env.local` に設定
   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
6. Workspace migration（トークン・設定テーブル）を適用
   ```bash
   npm run db:apply -- supabase/workspace/migrations/20260731120000_google_calendar_oauth.sql
   npm run db:apply -- supabase/workspace/migrations/20260731140000_calendar_writable_prefs.sql
   npm run db:apply -- supabase/workspace/migrations/20260731160000_task_scheduled_at.sql
   npm run db:apply -- supabase/workspace/migrations/20260731170000_calendar_week_starts_on.sql
   npm run db:apply -- supabase/workspace/migrations/20260731180000_calendar_day_starts_hour.sql
   npm run db:apply -- supabase/workspace/migrations/20260731190000_calendar_timezones.sql
   npm run db:apply -- supabase/workspace/migrations/20260801090000_friends_activities.sql
   ```
7. `/admin/workspace/calendar/` から「Googleカレンダーを接続」

Friends / Activities（交友録）:
- `/admin/workspace/friends/` — 友達一覧
- `/admin/workspace/activities/` — Activity 一覧
- カレンダー予定の詳細から友達を紐づけると、ローカル Activity が自動作成されます

スコープは `calendar.readonly` + `calendar.events`（表示と承認付き作業枠作成）。
既存接続がある場合は**一度解除して再接続**し、書き込み権限を付与する。

画面は [schedule-x](https://schedule-x.dev/)（週・日・月ビュー）。

週・日ビューは各日を2レーンに分ける:
- 左 = Google 予定
- 右 = Workspace Task の作業枠（`tasks.scheduled_at`。所要は `estimated_minutes`、未設定なら 30 分）

サイドバーの「未配置 Tasks」（表示切替可）から、右レーンへドラッグすると
`scheduled_at` を DB に保存するだけ（Google カレンダーには書かない）。
Task 詳細の「作業枠を作成」だけが、承認後に Google へ書き込む。

書き込みルール（Google）:
- 作業枠は Calendar 画面で選んだ「書き込み先」カレンダーにのみ作成
- 読取専用カレンダーには書けない
- プレビュー承認後のみ Google へ作成し、`calendar_links` に関連を保存
- Google 側の予定本文は Workspace DB に持たない

トークンは DB（RLS・anon 不可）に保存し、API レスポンスには含めない。

## Google Analytics

### 公開サイトの測定タグ

Hugo 時代の測定 ID を再開する。

```bash
NEXT_PUBLIC_GA_ID=G-K021MTL6NX
```

`src/app/layout.tsx` が gtag を挿入する（`/admin` 配下では出さない）。Vercel の Production / Preview / Development にも同値を設定する。

### Admin Analytics（Data API）

測定 ID（`G-...`）とは別に、**数字のプロパティ ID** とサービスアカウントが必要。

1. [Google Analytics](https://analytics.google.com/) → **管理 → プロパティ設定** で **プロパティ ID**（例: `123456789`）を控える → `GA_PROPERTY_ID`
2. [Google Cloud Console](https://console.cloud.google.com/)（Calendar と同じプロジェクトで可）
   - **API とサービス → ライブラリ** で **Google Analytics Data API** を有効化
   - **IAM と管理 → サービスアカウント** を作成（例: `ezeroms-analytics`）
   - キー（JSON）を作成し、`client_email` → `GA_SERVICE_ACCOUNT_EMAIL`、`private_key` → `GA_SERVICE_ACCOUNT_PRIVATE_KEY`
3. GA4 プロパティ → **プロパティ アクセス管理** で、そのサービスアカウントに **閲覧者** を付与
4. `.env.local` / Vercel に 3 変数を設定し、サーバー再起動

```bash
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_EMAIL=ezeroms-analytics@....iam.gserviceaccount.com
GA_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

管理画面: `/admin/analytics/`

## Workspace AI（Dashboard の相談）

提案のみ。Tasks / Docs / Calendar は自動更新しない。

```bash
WORKSPACE_AI_API_KEY=sk-...
# 任意
# WORKSPACE_AI_BASE_URL=https://api.openai.com/v1
# WORKSPACE_AI_MODEL=gpt-4o-mini
```

未設定でも Dashboard の他カードは動作し、相談欄だけ案内を表示する。

## Vercel に載せる変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVALIDATE_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://ezeroms.com`
- `ADMIN_EMAILS=you@example.com`（管理画面・admin API の許可リスト）
- `NEXT_PUBLIC_GA_ID=G-K021MTL6NX`
- （任意・Workspace を別プロジェクトにする場合のみ）`WORKSPACE_SUPABASE_URL` / `WORKSPACE_SUPABASE_SERVICE_ROLE_KEY`
- （Calendar 利用時）`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- （Analytics 利用時）`GA_PROPERTY_ID` / `GA_SERVICE_ACCOUNT_EMAIL` / `GA_SERVICE_ACCOUNT_PRIVATE_KEY`
- （AI 相談利用時）`WORKSPACE_AI_API_KEY`（任意で `WORKSPACE_AI_MODEL` / `WORKSPACE_AI_BASE_URL`）

`CONTENTFUL_*` / `VERCEL_TOKEN` / `SUPABASE_ACCESS_TOKEN` は本番に不要。

## 管理画面

- ログイン: `/admin/login/`
- ホーム: `/admin/workspace/`（ログイン後の標準遷移先。`/admin/` からもリダイレクト）
- Site Settings: `/admin/site/` · Analytics: `/admin/analytics/`
- Notes: `/admin/notes/` · `/admin/notes/new/`
- Clips: `/admin/clips/` · `/admin/clips/new/`

ナビ定義: `src/lib/admin/nav.ts`

## スタイル

- 新 UI: Tailwind + [`src/styles/design-tokens.css`](src/styles/design-tokens.css) + [`src/components/ui/`](src/components/ui/)
- 旧公開サイト CSS: [`src/styles/legacy/`](src/styles/legacy/)（移行完了まで残す。中身は極力触らない）
- 追加コンポーネント: `npx shadcn@latest add <name>`（`components.json` 参照）
