# ページ一覧（デバッグ用）

このドキュメントは、ezeroms.comの全ページタイプを一覧化したものです。デバッグやテスト時に参照してください。

**注意**: 詳細ページ（個別記事）については、各セクションの代表的な1ページのみを記載しています。

---

## 1. トップページ

| ページ名 | 役割 | URL |
|---------|------|-----|
| トップページ | サイトのホームページ。ロゴ、メッセージ、ランダム画像、ナビゲーションを表示 | `/` |

---

## 2. About セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| About 一覧 | Aboutセクションのトップページ（プロフィール） | `/about/` |
| このサイトについて | サイトの説明ページ | `/about/about-this-site/` |
| メディア掲載 | メディア掲載情報の一覧 | `/about/media-coverage/` |
| お問い合わせ | 連絡先情報 | `/about/contact/` |

**モバイルヘッダー**: ハンバーガーメニュー + ページタイトル + 目次ボタン（ハーフモーダルでAbout内のページ一覧を表示）

---

## 3. Tweet セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Tweet 一覧 | 最新月のTweet一覧にリダイレクト | `/tweet/` |
| Tweet 月別アーカイブ | 指定月のTweet一覧（例: 2025年6月） | `/tweet_month/2025-06/` |

**モバイルヘッダー**: ハンバーガーメニュー + 現在の年月表示 + 日付選択ボタン（ハーフモーダルで年月選択）

**タクソノミー**:
- `/tweet_tag/タグ名/` - タグ別Tweet一覧
- `/tweet_place/場所名/` - 場所別Tweet一覧

---

## 4. Diary セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Diary 一覧 | 最新月のDiary一覧にリダイレクト | `/diary/` |
| Diary 月別アーカイブ | 指定月のDiary一覧（例: 2025年9月） | `/diary_month/2025-09/` |
| Diary 詳細ページ（代表例） | 個別のDiary記事 | `/diary/2025-05-10/` |

**モバイルヘッダー**: ハンバーガーメニュー + 現在の年月表示 + 日付選択ボタン（ハーフモーダルで年月選択）

**タクソノミー**:
- `/diary_tag/タグ名/` - タグ別Diary一覧

---

## 5. Column セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Column 一覧 | Columnセクションのトップページ | `/column/` |
| Column カテゴリ別一覧 | カテゴリ別のColumn一覧（例: 音楽） | `/column_category/音楽/` |
| Column 詳細ページ（代表例） | 個別のColumn記事 | `/column/6xgc8ozluvuxhgwcf68yb9/` |

**モバイルヘッダー**: ハンバーガーメニュー + 現在のカテゴリ表示 + カテゴリ選択ボタン（ハーフモーダルでカテゴリ選択）

**タクソノミー**:
- `/column_tag/タグ名/` - タグ別Column一覧

---

## 6. Work セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Work 一覧 | Workセクションのトップページ | `/work/` |
| Work カテゴリ別一覧 | カテゴリ別のWork一覧 | `/work_category/カテゴリ名/` |
| Work 詳細ページ（代表例） | 個別のWork記事 | `/work/yoshikawa-yumi/` |

**モバイルヘッダー**: ハンバーガーメニュー + 現在のカテゴリ表示 + カテゴリ選択ボタン（ハーフモーダルでカテゴリ選択）

**タクソノミー**:
- `/work_tag/タグ名/` - タグ別Work一覧
- `/work_month/YYYY-MM/` - 月別Work一覧

---

## 7. The shoulders of Giants セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| The shoulders of Giants 一覧 | 文献引用の一覧ページ | `/shoulders-of-giants/` |

**モバイルヘッダー**: ハンバーガーメニュー + 現在のトピック表示 + トピック選択ボタン（ハーフモーダルでトピック選択）

**フィルタリング**: URLパラメータ `?topic=トピック名` でトピック別にフィルタリング可能

---

## 8. Chronicle セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Chronicle 一覧 | 年表形式のイベント一覧ページ | `/chronicle/` |

**モバイルヘッダー**: ハンバーガーメニュー + ページタイトル「Chronicle」 + フィルターボタン（ハーフモーダルでフィルター設定を表示）

**機能**:
- 生まれ年の設定
- 表示期間の設定
- 月単位表示の切り替え
- 元号表示の切り替え
- カテゴリ・サブカテゴリでのフィルタリング
- タグ（テーマ史）でのフィルタリング

**URLパラメータ**:
- `?birthYear=YYYY&birthMonth=MM` - 生まれ年の設定
- `?start=YYYY&end=YYYY` - 表示期間
- `?monthlyView=true` - 月単位表示
- `?eraDisplay=true` - 元号表示
- `?subcategories=カテゴリ|サブカテゴリ,...` - サブカテゴリフィルター
- `?tags=タグ1,タグ2,...` - タグフィルター

---

## 9. UI Design Guidebook セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| UI Design Guidebook 一覧 | UI Design Guidebookのトップページ（Readme） | `/ui-design-guidebook/` |
| Components 一覧 | Componentsカテゴリの一覧 | `/ui-design-guidebook/components/` |
| Patterns 一覧 | Patternsカテゴリの一覧 | `/ui-design-guidebook/patterns/` |
| Principles 一覧 | Principlesカテゴリの一覧 | `/ui-design-guidebook/principles/` |
| UI Design Guidebook 詳細ページ（代表例） | 個別の記事ページ | `/ui-design-guidebook/components/button/` |

**モバイルヘッダー**: ハンバーガーメニュー + ページタイトル + 目次ボタン（ハーフモーダルで目次を表示）

**ナビゲーション**: ヘッダーに「Readme」「Components」「Patterns」「Principles」のタブ表示

---

## 10. Media Coverage セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Media Coverage 一覧 | メディア掲載情報の一覧（Aboutセクション内） | `/about/media-coverage/` |

**モバイルヘッダー**: Aboutセクションと同じモバイルヘッダーを使用

---

## 11. Snap セクション

| ページ名 | 役割 | URL |
|---------|------|-----|
| Snap 一覧 | 写真ギャラリーの一覧ページ | `/snap/` |

**モバイルヘッダー**: なし（通常のヘッダーのみ）

---

## レスポンシブデザイン対応

### ブレークポイント
- **PC**: 1080px以上
- **タブレット**: 768px - 1079px
- **スマホ（SP）**: 767px以下

### モバイルヘッダーが表示されるページ
以下のページでは、SP/タブレット時に専用のモバイルヘッダーが表示されます：

1. **About** (`/about/`, `/about/about-this-site/`, `/about/media-coverage/`, `/about/contact/`)
2. **Tweet** (`/tweet/`, `/tweet_month/YYYY-MM/`)
3. **Diary** (`/diary/`, `/diary_month/YYYY-MM/`, `/diary/YYYY-MM-DD/`)
4. **Column** (`/column/`, `/column_category/カテゴリ/`, `/column/記事slug/`)
5. **Work** (`/work/`, `/work_category/カテゴリ/`, `/work/記事slug/`)
6. **The shoulders of Giants** (`/shoulders-of-giants/`)
7. **Chronicle** (`/chronicle/`)
8. **UI Design Guidebook** (`/ui-design-guidebook/` およびその配下の全ページ)

### モバイルヘッダーの構成
- **左側**: ハンバーガーメニューボタン（サイドバーを開く）
- **中央**: ページタイトル（長い場合は「...」で省略）
- **右側**: セクション固有のボタン（目次/フィルター/選択ボタンなど）

---

## レイアウトパターン

### 1. 中央配置型（Centered）
- **適用ページ**: トップページ (`/`)
- **クラス**: `.layout-main--centered`

### 2. TOC型（Table of Contents）
- **適用ページ**: About, Media Coverage, The shoulders of Giants, Chronicle
- **クラス**: `.layout-main--with-toc`
- **特徴**: 左側にTOC（目次/フィルター）を表示

### 3. タグ型（Tags）
- **適用ページ**: Tweet, Diary, Column, Work
- **クラス**: `.layout-main--with-tags`
- **特徴**: 左側にタグ/カテゴリナビゲーションを表示

### 4. ヘッダーTOC型（Header TOC）
- **適用ページ**: UI Design Guidebook
- **クラス**: `.layout-main--with-header-toc`
- **特徴**: 上部にタブナビゲーション、左側に目次を表示

---

## テスト時の注意点

1. **モバイルヘッダーの表示確認**: 各セクションでSP/タブレット時にモバイルヘッダーが正しく表示されるか確認
2. **ハーフモーダルの動作確認**: 各セクションのハーフモーダルが正しく開閉するか確認
3. **ナビゲーションの動作確認**: ハンバーガーメニューでサイドバーが正しく開閉するか確認
4. **レスポンシブレイアウトの確認**: 各ブレークポイントでレイアウトが正しく切り替わるか確認
5. **タクソノミーページの確認**: タグやカテゴリ別のページが正しく表示されるか確認

---

最終更新: 2025-01-XX

