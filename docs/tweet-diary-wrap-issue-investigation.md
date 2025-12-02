# Tweet/Diary list.html ラップ問題の調査レポート

## 問題の概要

`tweet/list.html`と`diary/list.html`が`baseof.html`でラップされてしまい、意図したスタンドアロンHTML（リダイレクトページ）が生成されない問題。

- **期待される動作**: 11行のスタンドアロンHTMLリダイレクトページ
- **実際の動作**: 1038行以上（baseof.htmlでラップされた状態）

## 重要な発見

### work/columnは正常に動作している

- `work/list.html`と`column/list.html`は正常に動作している
- これらは`{{ define "section_header" }}`と`{{ define "main" }}`を使用している
- baseof.htmlでラップされるが、これは意図された動作（通常のページレイアウト）

### tweet/diaryで問題が発生

- `tweet/list.html`と`diary/list.html`は完全なHTMLドキュメントを出力しようとしている
- `{{ define }}`を使わずに直接HTMLを出力している
- baseof.htmlが自動的にラップしてしまう

## ファイル構造の比較

### 正常に動作しているファイル

#### `layouts/work/list.html`
```go
{{ define "section_header" }}
    {{ partial "work-header-nav.html" . }}
{{ end }}

{{ define "main" }}
    <section class="page-section">
        <!-- コンテンツ -->
    </section>
{{ end }}

{{ define "secondary" }}
    {{ partial "work_menu.html" . }}
{{ end }}
```

#### `layouts/column/list.html`
```go
{{ define "section_header" }}
    {{ partial "column-header-nav.html" . }}
{{ end }}

{{ define "main" }}
    <section class="page-section">
        <!-- コンテンツ -->
    </section>
{{ end }}

{{ define "secondary" }}
    {{ partial "column_menu.html" . }}
{{ end }}
```

### 問題が発生しているファイル

#### `layouts/tweet/list.html`（現在の状態）
```go
{{ define "baseof" }}
{{/* Tweet一覧ページを最新記事の月のアーカイブページにリダイレクト */}}
<!-- リダイレクトロジック -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url={{ $redirectURL }}">
    <link rel="canonical" href="{{ $redirectURL }}">
</head>
<body>
    <script>window.location.replace("{{ $redirectURL }}");</script>
</body>
</html>
{{ end }}
```

#### `layouts/diary/list.html`（現在の状態）
```go
{{/* Diary一覧ページを最新記事の月のアーカイブページにリダイレクト */}}
<!-- リダイレクトロジック -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url={{ $redirectURL }}">
    <link rel="canonical" href="{{ $redirectURL }}">
</head>
<body>
    <script>window.location.replace("{{ $redirectURL }}");</script>
</body>
</html>
```

**注意**: `tweet/list.html`には`{{ define "baseof" }}`が追加されているが、`diary/list.html`にはない。しかし、どちらも問題が発生している。

## _index.mdファイルの確認

すべてのセクションに`_index.md`が存在し、すべて`layout: "list"`を指定している：

- `content/work/_index.md`: `layout: "list"`
- `content/column/_index.md`: `layout: "list"`
- `content/tweet/_index.md`: `layout: "list"`
- `content/diary/_index.md`: `layout: "list"`

**結論**: `_index.md`の存在や内容の違いは原因ではない。

## 試した解決策と結果

### 1. `{{ define "baseof" }}`を使用（tweet/list.html）
- **試行**: `tweet/list.html`で`{{ define "baseof" }}`を使用してbaseof.htmlを完全にオーバーライド
- **結果**: 失敗（ラップが続く）

### 2. `{{ define "main" }}`を使用
- **試行**: work/columnと同じ構造に変更
- **結果**: 未実施（リダイレクトページの目的を失うため）

### 3. `{{ define }}`を完全に削除
- **試行**: `diary/list.html`のように`{{ define }}`を使わない
- **結果**: 失敗（baseof.htmlが自動的にラップ）

### 4. `_index.md`の削除テスト
- **試行**: `tweet/_index.md`を一時的に削除してテスト
- **結果**: コマンドが中断され、未完了

## 根本原因の仮説

1. **Hugoのテンプレート解決ロジック**: `baseof.html`が存在する場合、Hugoは`list.html`テンプレートを自動的に`baseof.html`でラップしようとする
2. **`{{ define }}`の有無**: `{{ define "main" }}`などのブロック定義がない場合、Hugoはテンプレート全体を`baseof.html`の`main`ブロックに挿入しようとする
3. **完全なHTMLドキュメントの出力**: `<!DOCTYPE html>`から始まる完全なHTMLを出力しようとすると、Hugoのテンプレート解決ロジックと競合する

## 次のステップ（未実施）

### オプション1: `_index.md`の削除テスト
```bash
# tweet/_index.mdを一時的に削除してテスト
mv content/tweet/_index.md content/tweet/_index.md.backup
hugo
# 結果を確認
mv content/tweet/_index.md.backup content/tweet/_index.md
```

### オプション2: `{{ define "baseof" }}`の動作確認
- `tweet/list.html`の`{{ define "baseof" }}`が正しく動作しているか確認
- `diary/list.html`にも`{{ define "baseof" }}`を追加してテスト

### オプション3: 別のアプローチ
- リダイレクトをJavaScriptではなく、サーバーサイド（.htaccess、Netlify redirects等）で実装
- Hugoの`aliases`機能を使用（ただし、動的なリダイレクト先には対応していない可能性）

### オプション4: `baseof.html`の条件分岐
- `baseof.html`内で`tweet`や`diary`セクションを検出し、ラップをスキップ
- ただし、以前の試行では失敗している

## 関連ファイル

- `layouts/_default/baseof.html`: ベーステンプレート
- `layouts/tweet/list.html`: 問題が発生しているテンプレート
- `layouts/diary/list.html`: 問題が発生しているテンプレート
- `layouts/work/list.html`: 正常に動作しているテンプレート（参考）
- `layouts/column/list.html`: 正常に動作しているテンプレート（参考）
- `content/tweet/_index.md`: セクション設定ファイル
- `content/diary/_index.md`: セクション設定ファイル

## 調査日時

- 開始: 2024年12月2日
- 最新更新: 2024年12月2日

## メモ

- work/columnが正常に動作している理由は、`{{ define "main" }}`を使用してbaseof.htmlのブロックを適切にオーバーライドしているため
- tweet/diaryは完全なHTMLドキュメントを出力する必要があるため、baseof.htmlのラップを回避する必要がある
- `{{ define "baseof" }}`は理論的にはbaseof.htmlを完全にオーバーライドできるはずだが、実際には動作していない可能性がある

