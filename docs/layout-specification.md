# レイアウト仕様書

## 概要

このドキュメントは、ezeroms.comサイトのHugoレイアウトファイルの仕様を定義します。各レイアウトファイルがどのページで使用されるか、どのような機能を提供するかを説明します。

## 更新履歴

- 2025-12-01: 初版作成
- 2025-12-01: 年選択ヘッダーの月ボタン表示制御をJavaScriptからビルド時に判定する方式に変更
- 2025-12-01: セクションヘッダーのルールを追加
- 2025-12-01: Column/Work詳細ページのタグリンク動作とタグページのヘッダー状態を追加

---

## セクション一覧ページ（List Pages）

### Diary一覧ページ (`/diary/`)

**レイアウトファイル**: `layouts/diary/list.html`

**機能**: 最新のDiary記事がある月のアーカイブページにリダイレクトする完全なHTMLリダイレクトページ

**動作**:
1. Diaryセクション内のすべてのページから月（`YYYY-MM`形式）を抽出
2. 月をソートして最新の月を取得
3. `diary_month`タクソノミーから最新の月のアーカイブページのURLを取得
4. そのURLにリダイレクト（`meta refresh`、`canonical`、`window.location.replace`を使用）

**生成されるURL例**: `/diary_month/2025-09/`

**備考**: 
- 完全なHTMLドキュメントとして定義されており、`baseof.html`でラップされない
- 記事が存在しない場合は`/diary/`にリダイレクト（フォールバック）

---

### Tweet一覧ページ (`/tweet/`)

**レイアウトファイル**: `layouts/tweet/list.html` + `layouts/_default/baseof.html`（ワークアラウンド）

**機能**: 最新のTweet記事がある月のアーカイブページにリダイレクトする

**動作**:
1. `layouts/tweet/list.html`は完全なHTMLリダイレクトページとして定義されているが、Hugoのバグにより無視される
2. そのため、`layouts/_default/baseof.html`内でワークアラウンドとしてリダイレクト処理を実装
3. Tweetセクション内のすべてのページから月（`YYYY-MM`形式）を抽出
4. 月をソートして最新の月を取得
5. `tweet_month`タクソノミーから最新の月のアーカイブページのURLを取得
6. そのURLにリダイレクト（`meta refresh`、`canonical`、`window.location.replace`を使用）

**生成されるURL例**: `/tweet_month/2025-06/`

**備考**: 
- Hugoのバグにより、`layouts/tweet/list.html`が無視される問題がある
- `baseof.html`内の条件分岐: `{{ if and (eq .Section "tweet") (or (eq .RelPermalink "/tweet/") (eq (strings.TrimSuffix "/" .RelPermalink) "/tweet")) }}`
- 記事が存在しない場合は`/tweet/`にリダイレクト（フォールバック）

---

## 月別アーカイブページ（Month Archive Pages）

### Diary月別アーカイブページ (`/diary_month/YYYY-MM/`)

**レイアウトファイル**: `layouts/diary_month/term.html`

**使用されるページ**: 
- `/diary_month/2025-09/`
- `/diary_month/2025-08/`
- など、各月のアーカイブページ

**機能**:
- 指定された月のDiary記事を一覧表示
- 月選択ヘッダー（`date-selector-nav-diary.html`）を表示
- タグ一覧（`diary_menu.html`）を表示

**フィルタリング**:
- `{{ range where .Pages "Section" "diary" }}`でDiaryセクションのページのみを表示

**ヘッダー**: `partial "date-selector-nav-diary.html"`

**サイドバー**: `partial "diary_menu.html"`

---

### Tweet月別アーカイブページ (`/tweet_month/YYYY-MM/`)

**レイアウトファイル**: `layouts/tweet_month/term.html`

**使用されるページ**: 
- `/tweet_month/2025-06/`
- `/tweet_month/2025-05/`
- など、各月のアーカイブページ

**機能**:
- 指定された月のTweet記事を一覧表示
- 月選択ヘッダー（`date-selector-nav-tweet.html`）を表示
- タグ一覧（`tweet_menu.html`）を表示

**フィルタリング**:
- `{{ range where .Pages "Section" "tweet" }}`でTweetセクションのページのみを表示

**ヘッダー**: `partial "date-selector-nav-tweet.html"`

**サイドバー**: `partial "tweet_menu.html"`

---

## タグページ（Tag Pages）

### Diaryタグページ (`/diary_tag/tag-name/`)

**レイアウトファイル**: `layouts/diary_tag/term.html`

**使用されるページ**: 
- `/diary_tag/台湾/`
- `/diary_tag/食べ物/`
- など、各タグのページ

**機能**:
- 指定されたタグが付いたDiary記事を一覧表示
- 月選択ヘッダー（`date-selector-nav-diary.html`）を表示
- タグ一覧（`diary_menu.html`）を表示
- クリックされたタグに`active`クラスを付与

**フィルタリング**: Hugoのタクソノミー機能により自動的にフィルタリングされる

**ヘッダー**: `partial "date-selector-nav-diary.html"`

**サイドバー**: `partial "diary_menu.html"`

---

### Tweetタグページ (`/tweet_tag/tag-name/`)

**レイアウトファイル**: `layouts/tweet_tag/term.html`

**使用されるページ**: 
- `/tweet_tag/animation/`
- `/tweet_tag/アニメ/`
- など、各タグのページ

**機能**:
- 指定されたタグが付いたTweet記事を一覧表示
- 月選択ヘッダー（`date-selector-nav-tweet.html`）を表示
- タグ一覧（`tweet_menu.html`）を表示
- クリックされたタグに`active`クラスを付与

**フィルタリング**: Hugoのタクソノミー機能により自動的にフィルタリングされる

**ヘッダー**: `partial "date-selector-nav-tweet.html"`

**サイドバー**: `partial "tweet_menu.html"`

---

## 場所ページ（Place Pages）

### Tweet場所ページ (`/tweet_place/place-name/`)

**レイアウトファイル**: `layouts/tweet_place/term.html`

**使用されるページ**: 
- `/tweet_place/tokyo/`
- `/tweet_place/shibuya/`
- など、各場所のページ

**機能**:
- 指定された場所のTweet記事を一覧表示
- 月選択ヘッダー（`date-selector-nav-tweet.html`）を表示
- タグ一覧は表示しない（`{{ define "secondary" }}{{ end }}`）

**フィルタリング**:
- `{{ range where (where .Site.RegularPages "Section" "tweet") "Params.tweet_place" $currentPlace }}`でTweetセクションかつ指定された場所のページのみを表示

**ヘッダー**: `partial "date-selector-nav-tweet.html"`

**サイドバー**: なし

---

## サイドバー（Sidebar）

**レイアウトファイル**: `layouts/partials/sidebar.html`

**使用されるページ**: すべてのページ（`baseof.html`経由）

**機能**:
- グローバルナビゲーションを提供
- TweetとDiaryのリンクを、ビルド時に最新の月のアーカイブページに直接リンク

**リンクの動的生成**:

1. **Tweetリンク**:
   - Tweetセクション内のすべてのページから月を抽出
   - 最新の月のアーカイブページ（`/tweet_month/YYYY-MM/`）のURLを生成
   - 例: `/tweet_month/2025-06/`

2. **Diaryリンク**:
   - Diaryセクション内のすべてのページから月を抽出
   - 最新の月のアーカイブページ（`/diary_month/YYYY-MM/`）のURLを生成
   - 例: `/diary_month/2025-09/`

**アクティブ状態の判定**:
- Tweet: `/tweet/`、`/tweet_month/`、`/tweet_tag/`、`/tweet_place/`で始まるURLでアクティブ
- Diary: `/diary/`、`/diary_month/`、`/diary_tag/`で始まるURLでアクティブ

---

## ベーステンプレート（Base Template）

**レイアウトファイル**: `layouts/_default/baseof.html`

**使用されるページ**: すべてのページ（完全なHTMLドキュメントを定義しているページを除く）

**機能**:
- サイト全体の基本構造を提供
- HTMLの`<head>`と`<body>`の基本構造
- サイドバー、ヘッダー、メインコンテンツ、タグ一覧の配置
- Tweet一覧ページのリダイレクト処理（ワークアラウンド）

**Tweetリダイレクト処理**:
- `/tweet/`にアクセスした場合、最新の月のアーカイブページにリダイレクト
- `<head>`内に`meta refresh`と`canonical`を追加
- `<body>`内に`window.location.replace`を追加

---

## タクソノミー設定

**設定ファイル**: `config.toml`

**定義されているタクソノミー**:

```toml
[taxonomies]
  tweet_tag = "tweet_tag"
  tweet_month = "tweet_month"
  tweet_place = "tweet_place"
  diary_tag = "diary_tag"
  diary_month = "diary_month"
  column_tag = "column_tag"
  column_category = "column_category"
  work_tag = "work_tag"
  work_month = "work_month"
  # ... その他のタクソノミー
```

**タクソノミーとレイアウトファイルの対応**:

| タクソノミー | レイアウトファイル | URLパターン |
|------------|----------------|-----------|
| `tweet_month` | `layouts/tweet_month/term.html` | `/tweet_month/YYYY-MM/` |
| `tweet_tag` | `layouts/tweet_tag/term.html` | `/tweet_tag/tag-name/` |
| `tweet_place` | `layouts/tweet_place/term.html` | `/tweet_place/place-name/` |
| `diary_month` | `layouts/diary_month/term.html` | `/diary_month/YYYY-MM/` |
| `diary_tag` | `layouts/diary_tag/term.html` | `/diary_tag/tag-name/` |

---

## フロントマター要件

### Tweet記事

**必須フィールド**:
- `date`: 記事の日付（`YYYY-MM-DDTHH:mm:ssZ`形式）
- `tweet_month`: 記事の月（`YYYY-MM`形式、配列または文字列）

**オプションフィールド**:
- `tweet_tag`: タグのリスト
- `tweet_place`: 場所（文字列）
- `emoji`: 絵文字（文字列）
- `voice`: 声の種類（文字列、例: `loud`、`whisper`）

**例**:
```yaml
---
date: 2025-01-27T10:00:00Z
tweet_month: 2025-01
emoji: 🎬
tweet_tag:
  - animation
  - アニメ
  - 映画
tweet_place: Shibuya
---
```

### Diary記事

**必須フィールド**:
- `date`: 記事の日付（`YYYY-MM-DDTHH:mm:ssZ`形式）
- `diary_month`: 記事の月（`YYYY-MM`形式、配列）

**オプションフィールド**:
- `diary_tag`: タグのリスト
- `diary_place`: 場所（文字列）

**例**:
```yaml
---
date: 2025-05-10T10:00:00Z
diary_month:
  - 2025-05
diary_tag:
  - 台湾
  - 食べ物
  - 文化
diary_place: "Taipei, Taiwan"
---
```

---

## リダイレクトの動作

### リダイレクトが発生するページ

1. **`/diary/`** → `/diary_month/YYYY-MM/`（最新の月）
2. **`/tweet/`** → `/tweet_month/YYYY-MM/`（最新の月）

### リダイレクト方法

1. **HTML Meta Refresh**: `<meta http-equiv="refresh" content="0;url=...">`
2. **Canonical Link**: `<link rel="canonical" href="...">`
3. **JavaScript**: `window.location.replace("...")`

### リダイレクト先の決定ロジック

1. セクション内のすべてのページから日付を取得
2. 日付から月（`YYYY-MM`形式）を抽出
3. 月のリストをソート
4. 最新の月を取得
5. その月のタクソノミーページのURLを取得
6. そのURLにリダイレクト

---

## 既知の問題とワークアラウンド

### Hugoのバグ: Tweetセクションの`list.html`が無視される

**問題**: 
- `layouts/tweet/list.html`が完全なHTMLドキュメントとして定義されているにもかかわらず、Hugoが`baseof.html`でラップしてしまう
- `layouts/diary/list.html`は正常に動作するが、`layouts/tweet/list.html`は動作しない

**ワークアラウンド**:
- `layouts/_default/baseof.html`内でTweet一覧ページを検出し、リダイレクト処理を実装
- 条件: `{{ if and (eq .Section "tweet") (or (eq .RelPermalink "/tweet/") (eq (strings.TrimSuffix "/" .RelPermalink) "/tweet")) }}`

**詳細**: `docs/tweet-list-layout-issue.md`を参照

---

## レイアウトファイル一覧

### セクション一覧ページ
- `layouts/diary/list.html` - Diary一覧ページ（リダイレクト）
- `layouts/tweet/list.html` - Tweet一覧ページ（リダイレクト、現在は無視される）

### 月別アーカイブページ
- `layouts/diary_month/term.html` - Diary月別アーカイブページ
- `layouts/tweet_month/term.html` - Tweet月別アーカイブページ

### タグページ
- `layouts/diary_tag/term.html` - Diaryタグページ
- `layouts/tweet_tag/term.html` - Tweetタグページ

### 場所ページ
- `layouts/tweet_place/term.html` - Tweet場所ページ

### パーシャル（共通コンポーネント）
- `layouts/partials/sidebar.html` - サイドバー（グローバルナビゲーション）
- `layouts/partials/date-selector-nav-diary.html` - Diary月選択ヘッダー
- `layouts/partials/date-selector-nav-tweet.html` - Tweet月選択ヘッダー
- `layouts/partials/diary_menu.html` - Diaryタグ一覧
- `layouts/partials/tweet_menu.html` - Tweetタグ一覧

### ベーステンプレート
- `layouts/_default/baseof.html` - サイト全体の基本構造

---

## 年選択ヘッダー（Date Selector Navigation）

### 概要

Diary、Tweet、Workセクションで使用される月選択ヘッダーは、ビルド時に各ページで表示する年と月を固定化しています。JavaScriptによる動的な表示制御は行わず、生成されたHTMLをそのまま表示します。

### パーシャルファイル

- `layouts/partials/date-selector-nav-diary.html` - Diary用
- `layouts/partials/date-selector-nav-tweet.html` - Tweet用
- `layouts/partials/date-selector-nav-work.html` - Work用

### 動作仕様

#### 1. 表示年の決定

各ページで表示する年は、以下のロジックで決定されます：

1. **月別アーカイブページ** (`/diary_month/YYYY-MM/`など):
   - URLから月（`YYYY-MM`形式）を抽出
   - その月の年を表示年とする

2. **タグページ** (`/diary_tag/tag-name/`など):
   - 最新記事の年を表示年とする

3. **詳細ページ** (`/diary/YYYY-MM-DD/`など):
   - その記事の年を表示年とする

4. **一覧ページ** (`/diary/`など):
   - 最新記事の年を表示年とする

#### 2. 月ボタンの生成

- **表示年の12ヶ月のみを生成**（ビルド時に固定）
- すべての年のすべての月を生成するのではなく、表示年の12ヶ月のみを生成
- 記事がない月には`disabled`クラスとスタイル（`opacity: 0.4`、`cursor: not-allowed`、`pointer-events: none`）を適用

#### 3. 年変更の動作

- **前の年へのリンク**: 前の年の最初の月のアーカイブページ（存在する場合）へのリンク
- **次の年へのリンク**: 次の年の最初の月のアーカイブページ（存在する場合）へのリンク
- **無効状態**: 最小年/最大年に達している場合、`disabled`クラスを適用した`<span>`要素を表示

#### 4. アクティブ状態

- **月別アーカイブページ**: 表示中の月のボタンに`active`クラスを適用
- **タグページ**: すべての月ボタンを非アクティブ
- **詳細ページ**: すべての月ボタンを非アクティブ
- **一覧ページ**: すべての月ボタンを非アクティブ（Workセクションのみ）

### JavaScriptの削除

以前は、年を変更したときに月ボタンの表示/非表示を切り替えるJavaScriptが使用されていましたが、以下の理由で削除されました：

1. **ビルド時に固定化**: 各ページで表示する年と月をビルド時に決定し、HTMLに直接書き込む
2. **パフォーマンス向上**: JavaScriptによる動的な表示制御が不要になり、ページ読み込みが高速化
3. **シンプルな実装**: 生成されたHTMLをそのまま表示するため、実装がシンプルになる

### 使用例

**Diary月別アーカイブページ** (`/diary_month/2025-09/`):
- 表示年: 2025
- 生成される月ボタン: 2025年の12ヶ月（J, F, M, A, M, J, J, A, S, O, N, D）
- アクティブな月: 9月（S）
- 前の年へのリンク: `/diary_month/2024-05/`（2024年の最初の月）
- 次の年へのリンク: なし（2025年が最新年）

**Diaryタグページ** (`/diary_tag/台湾/`):
- 表示年: 最新記事の年（例: 2025）
- 生成される月ボタン: 2025年の12ヶ月
- アクティブな月: なし（すべて非アクティブ）
- 前の年へのリンク: 存在する場合のみ表示
- 次の年へのリンク: 存在する場合のみ表示

---

## セクションヘッダーのルール

### 概要

各セクションとタクソノミーページで使用するヘッダーの種類は、以下のルールに従って決定されます。

### ルール

| セクション/タクソノミー | ヘッダータイプ | パーシャルファイル |
|----------------------|--------------|------------------|
| `tweet_*`, `tweet/*` | 年選択 | `date-selector-nav-tweet.html` |
| `diary_*`, `diary/*` | 年選択 | `date-selector-nav-diary.html` |
| `column_*`, `column/*` | カテゴリ選択 | `column-header-nav.html` |
| `work_*`, `work/*` | カテゴリ選択 | `work-header-nav.html` |

### 詳細

#### Tweet関連（年選択）

以下のページで`date-selector-nav-tweet.html`を使用：

- `tweet/single.html` - Tweet詳細ページ
- `tweet_tag/term.html` - Tweetタグページ
- `tweet_month/term.html` - Tweet月別アーカイブページ
- `tweet_place/term.html` - Tweet場所ページ

#### Diary関連（年選択）

以下のページで`date-selector-nav-diary.html`を使用：

- `diary/single.html` - Diary詳細ページ
- `diary_tag/term.html` - Diaryタグページ
- `diary_month/term.html` - Diary月別アーカイブページ

#### Column関連（カテゴリ選択）

以下のページで`column-header-nav.html`を使用：

- `column/list.html` - Column一覧ページ
- `column/single.html` - Column詳細ページ
- `column_tag/term.html` - Columnタグページ
- `column_category/term.html` - Columnカテゴリページ

#### Work関連（カテゴリ選択）

以下のページで`work-header-nav.html`を使用：

- `work/list.html` - Work一覧ページ
- `work/single.html` - Work詳細ページ
- `work_tag/term.html` - Workタグページ
- `work_category/term.html` - Workカテゴリページ
- `work_month/term.html` - Work月別アーカイブページ

### 実装方法

各レイアウトファイルの`section_header`ブロックで、適切なパーシャルを呼び出します：

```go
{{ define "section_header" }}
    {{ partial "date-selector-nav-tweet.html" . }}
{{ end }}
```

または

```go
{{ define "section_header" }}
    {{ partial "work-header-nav.html" . }}
{{ end }}
```

### 注意事項

- このルールは、すべてのセクションとタクソノミーページで一貫して適用される必要があります
- 新しいページを追加する際は、このルールに従って適切なヘッダーを設定してください
- ヘッダーの種類を変更する場合は、このドキュメントも更新してください

---

## 詳細ページ（Single Pages）

### Column詳細ページ (`/column/article-slug/`)

**レイアウトファイル**: `layouts/column/single.html`

**機能**:
- Column記事の詳細を表示
- カテゴリ選択ヘッダー（`column-header-nav.html`）を表示
- タグ一覧（`column_menu.html`）を表示

**タグリンクの動作**:
- 記事内のタグ（`article-header__tags`内のタグ）をクリックすると、そのタグのタグページ（`/column_tag/tag-name/`）に遷移します
- タグリンクは`<a href="/column_tag/{{ . | urlize }}/">`として生成され、JavaScriptによる制御は行いません
- デフォルトのリンク動作を使用するため、`e.preventDefault()`などのJavaScriptは使用しません

**ヘッダー**: `partial "column-header-nav.html"`

**サイドバー**: `partial "column_menu.html"`

---

### Work詳細ページ (`/work/article-slug/`)

**レイアウトファイル**: `layouts/work/single.html`

**機能**:
- Work記事の詳細を表示
- カテゴリ選択ヘッダー（`work-header-nav.html`）を表示
- タグ一覧（`work_menu.html`）を表示

**タグリンクの動作**:
- 記事内のタグ（`article-header__tags`内のタグ）をクリックすると、そのタグのタグページ（`/work_tag/tag-name/`）に遷移します
- タグリンクは`<a href="/work_tag/{{ . | urlize }}/">`として生成され、JavaScriptによる制御は行いません
- デフォルトのリンク動作を使用するため、`e.preventDefault()`などのJavaScriptは使用しません

**ヘッダー**: `partial "work-header-nav.html"`

**サイドバー**: `partial "work_menu.html"`

---

## タグページのヘッダー状態

### Columnタグページ (`/column_tag/tag-name/`)

**ヘッダーの状態**:
- カテゴリ選択ヘッダー（`column-header-nav.html`）を表示します
- **すべてのカテゴリタブが非アクティブ状態**になります
- 「すべて」タブも非アクティブです
- これは、タグページではカテゴリによるフィルタリングを行わないためです

**実装**:
- `$isTagPage`フラグが`true`の場合、すべてのカテゴリタブに`active`クラスが付与されません
- 条件: `{{ if and $isListPage (not $isTagPage) (not $isCategoryPage) }}active{{ end }}`（「すべて」タブ）
- 条件: `{{ if and $isCategoryPage (eq $currentCategory .) (not $isTagPage) }}active{{ end }}`（各カテゴリタブ）

---

### Workタグページ (`/work_tag/tag-name/`)

**ヘッダーの状態**:
- カテゴリ選択ヘッダー（`work-header-nav.html`）を表示します
- **すべてのカテゴリタブが非アクティブ状態**になります
- 「すべて」タブも非アクティブです
- これは、タグページではカテゴリによるフィルタリングを行わないためです

**実装**:
- `$isTagPage`フラグが`true`の場合、すべてのカテゴリタブに`active`クラスが付与されません
- 条件: `{{ if and $isListPage (not $isTagPage) (not $isCategoryPage) }}active{{ end }}`（「すべて」タブ）
- 条件: `{{ if and $isCategoryPage (eq $currentCategory .) (not $isTagPage) }}active{{ end }}`（各カテゴリタブ）

---

### カテゴリページのヘッダー状態

#### Columnカテゴリページ (`/column_category/category-name/`)

**ヘッダーの状態**:
- 選択されたカテゴリのタブがアクティブ状態になります
- 「すべて」タブは非アクティブです

#### Workカテゴリページ (`/work_category/category-name/`)

**ヘッダーの状態**:
- 選択されたカテゴリのタブがアクティブ状態になります
- 「すべて」タブは非アクティブです

---

## 参考資料

- Hugo Template Lookup Order: https://gohugo.io/templates/lookup-order/
- Section Templates: https://gohugo.io/templates/section-templates/
- Taxonomy Templates: https://gohugo.io/templates/taxonomy-templates/
- Tweet一覧ページの問題調査: `docs/tweet-list-layout-issue.md`
- Hugoバグ報告テンプレート: `docs/hugo-bug-report-template.md`

