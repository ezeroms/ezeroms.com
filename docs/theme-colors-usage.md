# テーマファイルの色変数 - 使用箇所一覧

各色変数が実際にどこで使われているかをまとめました。

## メインカラー系

### `--color-primary` (#050317)
**役割**: メインカラー（ダークブルー/ブラック）

**代表的な使用箇所**:
1. **ヘッダーボタン** (`common/header.css`)
   - ヘッダーのCTAボタンの背景色
   - サイトの主要なアクションボタン

2. **ツールチップ** (`common/tooltip.css`)
   - ツールチップの背景色
   - ホバー時に表示される説明文の背景

3. **アクティブなタグ** (`common/article-tag.css`, `common/sidebar-tag.css`)
   - 選択されたタグの背景色
   - サイドバーと記事内のタグで使用

4. **サイドバーのツールチップ** (`common/site-shell.css`)
   - サイドバー最小化ボタンのツールチップ背景
   - アクティブなTOCリンクの右側ボーダー

### `--color-primary-hover` (#39393D)
**役割**: ホバー時のメインカラー

**代表的な使用箇所**:
1. **ヘッダーボタン** (`common/header.css`)
   - ヘッダーのCTAボタンのホバー時の背景色

### `--color-primary-active` (#5D5D5F)
**役割**: アクティブ時のメインカラー

**代表的な使用箇所**:
1. **ヘッダーボタン** (`common/header.css`)
   - ヘッダーのCTAボタンのクリック時の背景色

---

## セカンダリカラー系

### `--color-secondary-light` (rgba(0, 0, 0, 0.7))
**役割**: 薄いセカンダリ（70%不透明度）

**代表的な使用箇所**:
1. **サイドバー最小化ボタン** (`common/site-shell.css`)
   - ボタンのテキスト/アイコン色
   - 通常状態の表示

### `--color-secondary-lighter` (rgba(0, 0, 0, 0.65))
**役割**: より薄いセカンダリ（65%不透明度）

**代表的な使用箇所**:
1. **サイドバーナビゲーション** (`common/site-shell.css`)
   - サイドバーのリンクテキスト色
   - 通常状態のナビゲーション項目

### `--color-secondary-lightest` (rgba(0, 0, 0, 0.4))
**役割**: 最も薄いセカンダリ（40%不透明度）

**代表的な使用箇所**:
1. **サイドバーのセクション見出し** (`common/site-shell.css`)
   - ライブラリセクションの見出し色
   - セカンダリーナビゲーションの見出し

---

## 背景色系

### `--color-background` (#f9f9f7)
**役割**: メイン背景色（ベージュ/オフホワイト）

**代表的な使用箇所**:
1. **ページ全体の背景** (`common/site-shell.css`)
   - レイアウトコンテナの背景色
   - メインコンテンツエリアの背景

2. **タグの背景** (`common/article-tag.css`, `common/sidebar-tag.css`)
   - 通常状態のタグの背景色
   - 記事内タグとサイドバータグで使用

### `--color-background-white` (#ffffff)
**役割**: 白背景

**代表的な使用箇所**:
1. **ヘッダー** (`common/header.css`)
   - ヘッダーの背景色

2. **サイドバー** (`common/site-shell.css`)
   - サイドバーの背景色

3. **記事カード** (`common/article/article-item.css`)
   - 記事アイテムの背景色
   - 各記事のカード背景

4. **ナビゲーションリンク** (`common/article-navigation.css`)
   - 前後記事ナビゲーションの背景色

5. **カードコンポーネント** (`pages/about.css`, `pages/column.css`)
   - リンクカード、コラムカードの背景色

### `--color-background-hover` (rgba(0, 0, 0, 0.03))
**役割**: ホバー時の背景（3%不透明度）

**代表的な使用箇所**:
1. **サイドバーナビゲーション** (`common/site-shell.css`)
   - サイドバーリンクのホバー時の背景
   - TOCリンクのホバー時の背景

2. **サイドバー最小化ボタン** (`common/site-shell.css`)
   - ボタンのホバー時の背景

3. **セカンダリーナビゲーション** (`common/site-shell.css`)
   - プレースホルダーの背景色

### `--color-background-active` (rgba(0, 0, 0, 0.05))
**役割**: アクティブ時の背景（5%不透明度）

**代表的な使用箇所**:
1. **サイドバーナビゲーション** (`common/site-shell.css`)
   - アクティブなサイドバーリンクの背景
   - 現在のページを示す

2. **TOCリンク** (`common/site-shell.css`)
   - アクティブな目次リンクの背景
   - 現在読んでいるセクションを示す

---

## ボーダー色系

### `--color-border` (#E7E7E9)
**役割**: 標準ボーダー色（ライトグレー）

**代表的な使用箇所**:
1. **記事カード** (`common/article/article-item.css`)
   - 記事アイテムのボーダー
   - 記事ヘッダーの下線

2. **引用ブロック** (`common/article/article-item.css`)
   - 引用文の左側ボーダー

3. **タグ** (`common/article-tag.css`, `common/sidebar-tag.css`)
   - タグのボーダー色

4. **ナビゲーションリンク** (`common/article-navigation.css`)
   - 前後記事ナビゲーションのボーダー

5. **カードコンポーネント** (`pages/about.css`, `pages/column.css`)
   - リンクカード、コラムカードのボーダー

6. **ソーシャルアクションボタン** (`common/article/article-item.css`)
   - LINE、X、はてな、リンクボタンのボーダー

### `--color-border-hover` (#6E6D79)
**役割**: ホバー時のボーダー色（ミディアムグレー）

**代表的な使用箇所**:
1. **カードコンポーネント** (`pages/about.css`, `pages/column.css`)
   - リンクカード、コラムカードのホバー時のボーダー

2. **タグ** (`common/article-tag.css`, `common/sidebar-tag.css`)
   - タグのホバー時のボーダー

3. **ナビゲーションリンク** (`common/article-navigation.css`)
   - 前後記事ナビゲーションのホバー時のボーダー

4. **サイドバー最小化ボタン** (`common/site-shell.css`)
   - ボタンのホバー時のボーダー

5. **記事アイテム** (`common/article/article-item.css`)
   - 記事カードのホバー時のボーダー

### `--color-border-light` (#D0D0D1)
**役割**: 薄いボーダー色（ライトグレー）

**代表的な使用箇所**:
1. **ソーシャルアクションボタン** (`common/article/article-item.css`)
   - X、はてな、リンクボタンのホバー時のボーダー
   - LINEボタン以外のソーシャルボタンで使用

---

## アクセントカラー系

### `--color-accent-green` (#06C655)
**役割**: アクセントグリーン

**代表的な使用箇所**:
1. **LINE共有ボタン** (`common/article/article-item.css`)
   - LINE共有ボタンのホバー時のテキスト色
   - ソーシャルシェア機能で使用

### `--color-accent-green-light` (#C8EBCF)
**役割**: 薄いアクセントグリーン

**代表的な使用箇所**:
1. **LINE共有ボタン** (`common/article/article-item.css`)
   - LINE共有ボタンのホバー時のボーダー色
   - アクセントグリーンと組み合わせて使用

### `--color-selection` (#FCEDC3)
**役割**: テキスト選択時の背景色（ベージュ）

**代表的な使用箇所**:
1. **テキスト選択** (`common/common.css`)
   - ユーザーがテキストを選択した際の背景色
   - `::selection`と`::-moz-selection`で使用

---

## コード関連の色

### `--color-code-background` (#f4f4f4)
**役割**: コードブロックの背景色（ライトグレー）

**代表的な使用箇所**:
1. **インラインコード** (`common/article/article-item.css`)
   - 記事内のインラインコードの背景色
   - コードスニペットを強調表示

### `--color-code-text` (#C01443)
**役割**: コードテキストの色（ダークピンク/レッド）

**代表的な使用箇所**:
1. **インラインコード** (`common/article/article-item.css`)
   - 記事内のインラインコードのテキスト色
   - コードスニペットを強調表示

---

## テキストカラー系

### `--color-text-primary` (#050317)
**役割**: メインテキスト色（ダークブルー/ブラック）

**代表的な使用箇所**:
1. **見出し** (`common/article/article-item.css`, `common/article/article-item-heading.css`)
   - h1, h2, h3, h4のテキスト色
   - 記事タイトル、セクション見出し

2. **本文** (`common/article/article-item.css`)
   - 記事本文のテキスト色
   - 段落、リスト項目

3. **ヘッダーナビゲーション** (`common/header.css`)
   - ヘッダーのナビゲーションリンクのテキスト色

4. **タグ** (`common/article-tag.css`, `common/sidebar-tag.css`)
   - タグのテキスト色

5. **ナビゲーションリンク** (`common/article-navigation.css`)
   - 前後記事ナビゲーションのテキスト色

6. **サイドバーナビゲーション** (`common/site-shell.css`)
   - サイドバーリンクのテキスト色
   - アクティブなリンクのテキスト色

7. **カードタイトル** (`pages/column.css`)
   - コラムカードのタイトルテキスト色

### `--color-text-secondary` (#5D5D5F)
**役割**: セカンダリテキスト色（ミディアムグレー）

**代表的な使用箇所**:
1. **引用文** (`common/article/article-item.css`)
   - 引用ブロックのテキスト色

2. **記事ヘッダーの補足情報** (`common/article/article-item-heading.css`)
   - 記事ヘッダーの説明文、サブラベル

3. **画像のキャプション** (`common/article/article-item.css`)
   - 画像のalt属性から生成されるキャプション

4. **パンくずリスト** (`pages/column.css`)
   - パンくずリストのテキスト色

### `--color-text-tertiary` (#7a7a7a)
**役割**: 第三階層のテキスト色（グレー）

**代表的な使用箇所**:
1. **日付** (`common/article/article-item.css`)
   - 記事の日付表示

2. **TOCリンク** (`common/site-shell.css`)
   - 目次リンクのテキスト色（通常状態）

3. **ナビゲーションラベル** (`common/article-navigation.css`)
   - 前後記事ナビゲーションのラベル（「前の記事」「次の記事」）

4. **セカンダリーナビゲーション** (`common/site-shell.css`)
   - セカンダリーナビゲーションのプレースホルダー

5. **コラムカードの説明文** (`pages/column.css`)
   - コラムカードの日付表示

### `--color-text-dark` (#111)
**役割**: ダークテキスト色（ほぼ黒）

**代表的な使用箇所**:
1. **セカンダリーナビゲーション** (`common/site-shell.css`)
   - セカンダリーナビゲーションリンクのホバー時のテキスト色

### `--color-text-inverse` (#ffffff)
**役割**: 反転テキスト色（白）

**代表的な使用箇所**:
1. **ヘッダーボタン** (`common/header.css`)
   - ヘッダーのCTAボタンのテキスト色

2. **ツールチップ** (`common/tooltip.css`)
   - ツールチップのテキスト色

3. **アクティブなタグ** (`common/article-tag.css`, `common/sidebar-tag.css`)
   - 選択されたタグのテキスト色

4. **サイドバーのツールチップ** (`common/site-shell.css`)
   - サイドバー最小化ボタンのツールチップテキスト色

---

## 使用頻度の高い色変数

### 最も使用頻度が高い
1. **`--color-text-primary`** - 見出し、本文、リンクなど、ほとんどのテキストで使用
2. **`--color-border`** - カード、タグ、ボタンなど、多くのコンポーネントのボーダーで使用
3. **`--color-background-white`** - カード、サイドバー、ヘッダーなど、多くのコンポーネントの背景で使用

### 中程度の使用頻度
4. **`--color-background-hover`** - ナビゲーション、リンクのホバー状態で使用
5. **`--color-border-hover`** - カード、タグのホバー状態で使用
6. **`--color-text-secondary`** - 補足情報、引用文で使用

### 特定の用途で使用
7. **`--color-primary`** - ボタン、アクティブなタグ、ツールチップで使用
8. **`--color-text-tertiary`** - 日付、メタ情報、TOCリンクで使用
9. **`--color-background-active`** - アクティブなナビゲーション項目で使用

---

## 色の必要性の判断基準

### 必須（削除不可）
- `--color-text-primary` - サイトの主要なテキスト色
- `--color-background-white` - カードやコンテナの背景
- `--color-border` - コンポーネントの区切り線
- `--color-primary` - 主要なアクション要素

### 推奨（UX向上に重要）
- `--color-background-hover` - インタラクティブ要素のフィードバック
- `--color-border-hover` - ホバー時の視覚的フィードバック
- `--color-text-secondary` - 情報の階層化

### オプション（特定用途のみ）
- `--color-accent-green` - LINE共有機能専用
- `--color-code-background` / `--color-code-text` - コード表示専用
- `--color-selection` - テキスト選択時の視覚的フィードバック



