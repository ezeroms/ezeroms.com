# {{ define "main" }}の仕組みとtweet/diaryでの使用可能性

## {{ define "main" }}とは

`{{ define "main" }}`は、Hugoのテンプレートシステムで使用される**ブロック定義**です。

### 仕組み

1. **baseof.htmlでの定義**:
   ```go
   <main class="layout-main__content" id="main-content">
       {{ block "main" . }}{{ end }}
   </main>
   ```
   - `{{ block "main" . }}`は、後で定義されるコンテンツを挿入する場所を示します

2. **list.htmlなどでの定義**:
   ```go
   {{ define "main" }}
       <section class="page-section">
           <!-- コンテンツ -->
       </section>
   {{ end }}
   ```
   - `{{ define "main" }}`で定義されたコンテンツが、baseof.htmlの`{{ block "main" }}`の位置に挿入されます

3. **結果**:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>Page Title</title>
   </head>
   <body>
       <div class="layout-container">
           <!-- サイドバーなど -->
           <main class="layout-main__content" id="main-content">
               <section class="page-section">
                   <!-- コンテンツ -->
               </section>
           </main>
       </div>
   </body>
   </html>
   ```

## tweet/diaryで{{ define "main" }}を使うことができるか

### 問題点

tweet/diaryの`list.html`は、**完全なHTMLドキュメント（リダイレクトページ）**を出力する必要があります：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=/tweet/2024-12/">
    <link rel="canonical" href="/tweet/2024-12/">
</head>
<body>
    <script>window.location.replace("/tweet/2024-12/");</script>
</body>
</html>
```

しかし、`{{ define "main" }}`を使うと：

1. コンテンツはbaseof.htmlの`<main>`タグ内に配置される
2. baseof.htmlの構造（`<!DOCTYPE html>`、`<html>`、`<head>`、`<body>`）が既に存在する
3. `{{ define "main" }}`内に`<!DOCTYPE html>`や`<html>`タグを書くと、無効なHTMLになる

### 可能なアプローチ

#### アプローチ1: JavaScriptのみでリダイレクト

`{{ define "main" }}`内にJavaScriptのみを配置：

```go
{{ define "main" }}
<script>window.location.replace("{{ $redirectURL }}");</script>
{{ end }}
```

**問題点**:
- `<meta http-equiv="refresh">`は`<head>`内に配置する必要があるが、`{{ define "main" }}`のコンテンツは`<body>`内に配置される
- SEO的には`<link rel="canonical">`も`<head>`内に配置する必要がある

#### アプローチ2: baseof.htmlを修正して条件分岐

baseof.htmlでtweet/diaryセクションを検出し、`<head>`内に`<meta>`タグを追加：

```go
<head>
    <meta charset="UTF-8">
    <title>{{ .Title }}</title>
    {{ if or (eq .Section "tweet") (eq .Section "diary") }}
        {{ block "redirect_meta" . }}{{ end }}
    {{ end }}
</head>
```

そして、`tweet/list.html`で：

```go
{{ define "redirect_meta" }}
<meta http-equiv="refresh" content="0;url={{ $redirectURL }}">
<link rel="canonical" href="{{ $redirectURL }}">
{{ end }}

{{ define "main" }}
<script>window.location.replace("{{ $redirectURL }}");</script>
{{ end }}
```

**利点**:
- 正しいHTML構造を維持できる
- `<meta>`タグを`<head>`内に配置できる
- `<link rel="canonical">`も`<head>`内に配置できる

**問題点**:
- baseof.htmlを修正する必要がある
- 他のセクションに影響を与える可能性がある

#### アプローチ3: {{ define "baseof" }}で完全オーバーライド

`tweet/list.html`で`{{ define "baseof" }}`を使ってbaseof.htmlを完全にオーバーライド：

```go
{{ define "baseof" }}
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

**問題点**:
- 以前の試行では動作しなかった
- Hugoのテンプレート解決ロジックが原因の可能性がある

## 推奨アプローチ

**アプローチ2（baseof.htmlを修正して条件分岐）**が最も現実的です：

1. baseof.htmlの`<head>`内に条件分岐を追加
2. tweet/diaryセクションの場合のみ、`{{ block "redirect_meta" }}`を追加
3. `tweet/list.html`と`diary/list.html`で`{{ define "redirect_meta" }}`と`{{ define "main" }}`を定義

これにより：
- 正しいHTML構造を維持できる
- `<meta>`タグと`<link rel="canonical">`を`<head>`内に配置できる
- JavaScriptによるリダイレクトも動作する
- 他のセクションに影響を与えない

## テスト結果

### アプローチ1: {{ define "main" }}を使用
- **結果**: 失敗
- **理由**: baseof.htmlの構造内（`<body>`内の`<main>`）に配置されるため、完全なHTMLドキュメントを出力できない

### アプローチ2: {{ define "baseof" }}を使用
- **結果**: 失敗
- **理由**: Hugoのテンプレート解決ロジックでは、`layouts/_default/baseof.html`が最優先されるため、`layouts/tweet/list.html`で`{{ define "baseof" }}`を定義しても、`layouts/_default/baseof.html`が使用されてしまう

## 結論

**tweet/diaryで`{{ define "main" }}`を使うことは技術的には可能ですが、完全なHTMLドキュメント（リダイレクトページ）を出力することはできません。**

理由：
1. `{{ define "main" }}`のコンテンツは、baseof.htmlの`<body>`内の`<main>`タグに配置される
2. リダイレクトページは`<!DOCTYPE html>`から始まる完全なHTMLドキュメントである必要がある
3. baseof.htmlの構造内に配置されるため、`<!DOCTYPE html>`や`<html>`タグを書くと無効なHTMLになる

**`{{ define "baseof" }}`も動作しません。**
- Hugoのテンプレート解決ロジックでは、`layouts/_default/baseof.html`が最優先される
- セクション固有のテンプレート（`layouts/tweet/list.html`）で`{{ define "baseof" }}`を定義しても、`layouts/_default/baseof.html`が使用される

## 現在の状態

- `tweet/list.html`: `{{ define "baseof" }}`を使用（動作しない）
- `diary/list.html`: `{{ define "baseof" }}`を使用（動作しない）
- 両方ともbaseof.htmlでラップされている（1041行）

## 根本的な問題

Hugoのテンプレート解決ロジックでは、`layouts/_default/baseof.html`が存在する限り、すべてのテンプレートがbaseof.htmlでラップされます。リダイレクトページを完全なHTMLドキュメントとして出力するには、baseof.htmlを使わない必要がありますが、Hugoのデフォルト動作ではこれを回避することが困難です。

## 可能な解決策

1. **baseof.htmlを削除またはリネーム**: 他のページに影響を与える可能性がある
2. **Hugoの設定でbaseof.htmlを無効化**: そのような設定は存在しない
3. **別のアプローチ**: サーバーサイドリダイレクト（.htaccess、Netlify redirects等）を使用
4. **Hugoのバグとして報告**: この動作が意図されたものかどうか確認

