# Tweet 一覧ページのレイアウト問題の調査記録

## 問題の概要

`/tweet/` ページで、headerとtag一覧が空になる問題が繰り返し発生している。この問題は、Hugoが `layouts/tweet/list.html` を無視して、別のレイアウト（`baseof.html` ベース）を使用していることが原因と考えられる。

## 発生状況

- **問題**: `/tweet/` ページのheaderとtag一覧が空になる
- **頻度**: 他のページを編集してビルドすると再発する
- **影響**: Tweet一覧ページが正しく表示されない

## 現在の状態

### 正常に動作しているページ
- `/diary/` - `public/diary/index.html` は63行で正しくリダイレクトページになっている
- `/work/` - 正常に動作
- `/column/` - 正常に動作

### 問題が発生しているページ
- `/tweet/` - `public/tweet/index.html` は362行で `baseof.html` の構造が使用されている

## ファイル構造の比較

### レイアウトファイル

**`layouts/tweet/list.html`** と **`layouts/diary/list.html`** は完全に同じ構造：
- 両方とも完全なHTMLリダイレクトページとして定義されている
- `<!DOCTYPE html>` から始まり、`<html>`, `<head>`, `<body>` を含む完全なHTMLドキュメント
- 唯一の違いは、セクション名（`tweet` vs `diary`）とタクソノミー名（`tweet_month` vs `diary_month`）

### コンテンツファイル

**`content/tweet/_index.md`** と **`content/diary/_index.md`** は同じ構造：
```markdown
---
title: "Tweet"
layout: "list"
---
```

## 調査結果

### 1. 生成されたHTMLの比較

**`public/diary/index.html`** (正常):
- 63行
- `<!DOCTYPE html>` で始まる
- リダイレクトコード（`refresh`, `canonical`, `window.location.replace`）が含まれている
- `baseof.html` の構造が使われていない

**`public/tweet/index.html`** (問題あり):
- 362行
- `<!DOCTYPE html>` で始まるが、`<html lang="en">` が含まれている（`baseof.html` の構造）
- リダイレクトコードが含まれていない
- `layout-header` と `layout-tags` が空
- Tweet記事のリストが表示されている（`article-container tweet-container`）

### 2. Hugoのレイアウト解決順序の問題

Hugoは以下の順序でレイアウトを解決する：
1. `layouts/[SECTION]/[LAYOUT].html`
2. `layouts/_default/[LAYOUT].html`
3. `layouts/_default/[KIND].html`

`content/tweet/_index.md` で `layout: "list"` が指定されている場合、Hugoは `layouts/tweet/list.html` を使用するはずだが、実際には使用されていない。

### 3. 原因の仮説

1. **Hugoが完全なHTMLドキュメントを認識していない可能性**
   - `layouts/tweet/list.html` は完全なHTMLドキュメントとして定義されているが、Hugoがこれを無視している
   - `baseof.html` でラップされてしまっている

2. **別のレイアウトファイルが優先されている可能性**
   - `layouts/_default/` 内にTweet関連のレイアウトが存在する可能性
   - 調査結果: `layouts/_default/terms.tweet_month.html` と `layouts/_default/terms.tweet_tag.html` は削除済み

3. **キャッシュやビルドの問題**
   - Hugoのキャッシュが古い可能性
   - `public/` や `resources/` ディレクトリを削除してクリーンビルドを試行したが、問題は解決していない

## 試行した解決策

### 1. `layouts/tweet/list.html` の再作成
- `layouts/diary/list.html` から完全にコピーして作成
- セクション名とタクソノミー名のみ変更
- **結果**: 問題は解決せず

### 2. `content/tweet/_index.md` の修正
- `content/diary/_index.md` と同じ構造に統一
- `type: "tweet"` などの余分なフロントマターを削除
- **結果**: 問題は解決せず

### 3. `layouts/_default/` 内のTweet関連ファイルの削除
- `layouts/_default/terms.tweet_month.html` を削除
- `layouts/_default/terms.tweet_tag.html` を削除
- **結果**: 問題は解決せず

### 4. クリーンビルドの実行
- `public/` ディレクトリを削除
- `resources/` ディレクトリを削除
- `hugo --cleanDestinationDir` でビルド
- **結果**: 問題は解決せず

## 現在のファイル状態

### レイアウトファイル

- `layouts/tweet/list.html`: 完全なHTMLリダイレクトページ（33行）
- `layouts/diary/list.html`: 完全なHTMLリダイレクトページ（33行）
- 両ファイルは構造的に同一（セクション名とタクソノミー名のみ異なる）

### コンテンツファイル

- `content/tweet/_index.md`: `layout: "list"` を指定
- `content/diary/_index.md`: `layout: "list"` を指定
- 両ファイルは構造的に同一

## 次の調査ステップ

1. **Hugoのレイアウト解決ログの確認**
   - `hugo --verbose` でビルドして、どのレイアウトが使用されているか確認

2. **`layouts/_default/` 内のファイルの確認**
   - `layouts/_default/section.html` が存在するか確認
   - `layouts/_default/list.html` が存在するか確認

3. **Hugoのバージョンや設定の問題**
   - `config.toml` の設定を確認
   - Hugoのバージョンを確認

4. **ファイルシステムの問題**
   - ファイルの権限や属性（拡張属性など）を確認
   - `.DS_Store` などのファイルが影響していないか確認

## 関連ファイル

### レイアウトファイル
- `layouts/tweet/list.html`
- `layouts/diary/list.html`
- `layouts/_default/baseof.html`

### コンテンツファイル
- `content/tweet/_index.md`
- `content/diary/_index.md`

### 生成されたファイル
- `public/tweet/index.html` (362行、問題あり)
- `public/diary/index.html` (63行、正常)

## 参考情報

- Hugoのレイアウト解決順序: https://gohugo.io/templates/lookup-order/
- セクション一覧ページのレイアウト: https://gohugo.io/templates/section-templates/
- 完全なHTMLドキュメントの扱い: Hugoは `<!DOCTYPE html>` から始まるファイルを完全なHTMLドキュメントとして認識し、`baseof.html` でラップしないはず

## 現在のファイルの詳細情報

### `content/tweet/_index.md` の注意点
- 現在、`type: "tweet"` という余分なフロントマターが含まれている可能性がある
- `content/diary/_index.md` と同じ構造（`layout: "list"` のみ）に統一する必要がある

### 重要な観察結果

1. **`layouts/tweet/list.html` は完全に無視されている**
   - Hugoはこのファイルを読み込んでいない、または無視している
   - 代わりに `baseof.html` と別のレイアウト（おそらく `layouts/_default/` のレイアウト）を使用している

2. **`layouts/diary/list.html` は正常に動作している**
   - 同じ構造のファイルが、Diaryでは正常に動作している
   - これは、Tweet特有の問題であることを示唆している

3. **`public/tweet/index.html` にはTweet記事のリストが表示されている**
   - これは、Hugoが何らかのレイアウトを使用してページを生成していることを意味する
   - おそらく、`layouts/_default/` のレイアウトが使用されている

## 追加の調査が必要な項目

### 1. Hugoのレイアウト解決ログの詳細確認
```bash
hugo --verbose 2>&1 | grep -i "tweet\|layout" > hugo-debug.log
```
- どのレイアウトファイルが実際に使用されているか
- エラーメッセージや警告がないか

### 2. ファイル属性の確認
```bash
ls -la@ layouts/tweet/list.html layouts/diary/list.html
xattr -l layouts/tweet/list.html layouts/diary/list.html
```
- macOSの拡張属性が影響していないか
- ファイルの権限が同じか

### 3. Hugoの設定確認
- `config.toml` にTweetセクションに関する特別な設定がないか
- `cloudcannon.config.yml` などの外部CMS設定が影響していないか

### 4. 他のセクションとの比較
- `/work/` は正常に動作しているか確認
- `/column/` は正常に動作しているか確認
- これらのセクションの `list.html` の構造を比較

## コマンド履歴

以下は調査中に実行した主要なコマンド：

```bash
# 生成されたHTMLの比較
diff <(head -35 public/tweet/index.html) <(head -35 public/diary/index.html)

# ファイル構造の比較
diff layouts/tweet/list.html layouts/diary/list.html

# クリーンビルド
rm -rf public/tweet resources
hugo --cleanDestinationDir --quiet

# レイアウトファイルの検索
find layouts -name "*tweet*" -type f

# 生成されたHTMLの確認
wc -l public/tweet/index.html public/diary/index.html
grep -E "refresh|canonical|window.location" public/tweet/index.html
```

## 最新の調査結果 (2025-12-01 14:16)

### 試行した解決策（追加）

5. **`content/tweet/_index.md`から`type: "tweet"`を削除**
   - `content/tweet/_index.md`に`type: "tweet"`という余分なフロントマターが含まれていた
   - これを削除して`content/diary/_index.md`と同じ構造にした
   - **結果**: 問題は解決せず

6. **`layouts/tweet/list.html`を完全に再作成**
   - ファイルを削除して、heredocを使用して新規作成
   - `layouts/diary/list.html`と同じ構造を完全にコピー
   - **結果**: 問題は解決せず

### 現在の状態

- `public/tweet/index.html`は依然として362行で`baseof.html`でラップされている
- `public/diary/index.html`は63行で正しくリダイレクトページになっている
- `layouts/tweet/list.html`と`layouts/diary/list.html`は構造的に同一
- `content/tweet/_index.md`と`content/diary/_index.md`は構造的に同一（`type`を削除後）

### 発見された重要な事実

1. **`content/tweet/_index.md`に`type: "tweet"`が含まれていた**
   - これは削除したが、問題は解決しなかった

2. **`public/tweet/index.html`には`notification.html`のpartialが含まれている**
   - これは`layouts/tweet_month/term.html`や`layouts/tweet_tag/term.html`で使われている
   - これは、Hugoが`layouts/tweet/list.html`を無視して、別のレイアウトを使用していることを示唆している

3. **`public/tweet/index.html`には`article-container tweet-container`が含まれている**
   - これは、Tweet記事のリストが表示されていることを意味する
   - これは、Hugoが何らかのレイアウトを使用してページを生成していることを意味する

### 次の調査ステップ

1. **Hugoの内部キャッシュをクリア**
   - Hugoの内部キャッシュを削除して再ビルド
   - `resources/`ディレクトリを削除

2. **Hugoのデバッグモードでビルド**
   - `hugo --verbose --debug`でビルドして、詳細なログを確認

3. **他のセクション（Work、Column）の動作確認**
   - `/work/`や`/column/`が正しく動作しているか確認
   - これらのセクションの`list.html`が正しく動作している理由を特定

4. **Hugoのソースコード調査**
   - Hugoが完全なHTMLドキュメントをどのように処理しているか調査
   - レイアウト解決のロジックを理解する

## 更新履歴

- 2025-12-01: 問題の発生と調査を開始
- 2025-12-01: ドキュメント作成
- 2025-12-01: 詳細な調査結果と観察結果を追加
- 2025-12-01: 追加の調査項目とコマンド履歴を追加
- 2025-12-01 14:16: `type: "tweet"`の削除と`list.html`の再作成を試行したが、問題は解決せず
- 2025-12-01 19:52: Hugoのテンプレートメトリクスで`tweet/list.html`が1回実行されていることを確認。しかし、`public/tweet/index.html`は依然として`baseof.html`でラップされている。`layouts/tweet/list.html`を削除しても`baseof.html`が使用されることを確認。Hugoが`layouts/tweet/list.html`を完全に無視している可能性が高い。
- 2025-12-01 20:15: `printf`コマンドで`layouts/tweet/list.html`を再作成し、改行コードの問題を排除したが、問題は解決せず。`public/diary/index.html`の最初の行は空行（`\n`）であるのに対し、`public/tweet/index.html`の最初の行は`<!DOCTYPE html>`（`baseof.html`の構造）であることを確認。Hugoが`layouts/tweet/list.html`を完全に無視していることが確定。

## 追加調査（2025-12-01 23:00以降）

### なぜDiaryやWorkは問題なく、Tweetだけが問題が発生するのか？

#### 調査結果

1. **ファイル構造の比較**
   - `layouts/tweet/list.html`と`layouts/diary/list.html`は構造的に完全に同一（MD5ハッシュを比較しても、セクション名を置換すれば同一）
   - `content/tweet/_index.md`と`content/diary/_index.md`も構造的に同一（`layout: "list"`を指定）
   - ファイルの属性、権限、拡張属性も同一

2. **タクソノミーの違い**
   - **Tweet**: `tweet_tag`、`tweet_month`、`tweet_place`（3つのタクソノミー）
   - **Diary**: `diary_tag`、`diary_month`（2つのタクソノミー）
   - **Work**: `work_tag`、`work_month`（2つのタクソノミー）
   - Tweetには`tweet_place`という追加のタクソノミーが存在する

3. **レイアウトファイルの違い**
   - **Tweet**: `layouts/tweet_tag/term.html`、`layouts/tweet_month/term.html`、`layouts/tweet_place/term.html`（3つのterm.html）
   - **Diary**: `layouts/diary_tag/term.html`、`layouts/diary_month/term.html`（2つのterm.html）
   - **Work**: `layouts/work_tag/term.html`、`layouts/work_month/term.html`（2つのterm.html）
   - すべてのterm.htmlは`{{ define "main" }}`ブロック形式

4. **`layouts/_default/`内のファイル**
   - **Diary**: `layouts/_default/taxonomy.diary_month.html`、`layouts/_default/taxonomy.diary_tag.html`、`layouts/_default/terms.diary_month.html`、`layouts/_default/terms.diary_tag.html`が存在
   - **Tweet**: `layouts/_default/`内にTweet関連のファイルは存在しない
   - **Work**: `layouts/_default/`内にWork関連のファイルは存在しない

5. **出力ファイルの内容**
   - `public/tweet/index.html`には`article-container tweet-container`が含まれている（116行目）
   - これは`layouts/tweet_tag/term.html`、`layouts/tweet_month/term.html`、`layouts/tweet_place/term.html`に含まれるHTML
   - `public/tweet/index.html`は`baseof.html`でラップされている（`<!DOCTYPE html><html lang="en">`から始まる）
   - `public/diary/index.html`は完全なHTMLドキュメントとして正しく生成されている（`<!DOCTYPE html>`から始まり、`baseof.html`でラップされていない）

6. **Hugoのテンプレートメトリクス**
   - `tweet/list.html`は1回実行されている（`311.166µs`）
   - しかし、出力は`baseof.html`でラップされている
   - `tweet_tag/term.html`、`tweet_month/term.html`、`tweet_place/term.html`も実行されている

7. **Hugoのバージョン変更テスト**
   - Hugo 0.152.2（現在のバージョン）で問題が発生
   - Hugo 0.132.1（`netlify.toml`で指定されているバージョン）のダウンロードを試みたが、GitHubリリースページから404エラーが返された
   - バージョン変更による解決は未検証

### 重要な発見

**`public/tweet/index.html`に`article-container tweet-container`が含まれている**ということは、Hugoが`layouts/tweet/list.html`を無視して、代わりに`layouts/tweet_tag/term.html`や`layouts/tweet_month/term.html`のようなレイアウトを使用している可能性があります。

しかし、Hugoのテンプレートメトリクスでは`tweet/list.html`が1回実行されているため、Hugoは`layouts/tweet/list.html`を読み込んでいるものの、完全なHTMLドキュメントとして認識していない可能性があります。

### 仮説

1. **Tweet固有のタクソノミー（`tweet_place`）が原因**
   - Tweetには`tweet_place`という追加のタクソノミーが存在する
   - これがHugoのレイアウト解決に影響を与えている可能性

2. **`layouts/_default/taxonomy.html`や`layouts/_default/term.html`の影響**
   - これらのファイルは`{{ define "main" }}`ブロック形式
   - Tweetセクションに対して、これらのデフォルトレイアウトが優先されている可能性

3. **Hugoのレイアウト解決のバグ**
   - 特定の条件下（複数のタクソノミー、複数のterm.htmlファイル）で、完全なHTMLドキュメントが認識されない可能性
   - `layouts/tweet/list.html`が実行されているが、出力が`baseof.html`でラップされている

## 根本原因の仮説

現在の調査結果から、以下の仮説が考えられます：

1. **Hugoのレイアウト解決順序の問題**
   - Hugoが`layouts/tweet/list.html`を読み込む前に、別のレイアウト（おそらく`layouts/_default/`のレイアウト）が優先されている可能性
   - しかし、`layouts/_default/list.html`や`layouts/_default/section.html`は存在しない

2. **Hugoのバグまたはバージョン固有の問題**
   - Hugo v0.152.2で、特定の条件下で完全なHTMLドキュメントが認識されない可能性
   - `layouts/diary/list.html`は正常に動作しているが、`layouts/tweet/list.html`は動作しない

3. **ファイルシステムまたはキャッシュの問題**
   - macOSの拡張属性やファイルシステムの問題が影響している可能性
   - しかし、ファイルの属性や権限は`layouts/diary/list.html`と同じ

4. **Tweet固有の設定やロジックが原因**
   - `tweet_place`タクソノミーの存在
   - 3つのterm.htmlファイルの存在
   - これらの要因がHugoのレイアウト解決に影響を与えている可能性

## 次の調査ステップ（推奨）

1. **Hugoのソースコード調査**
   - Hugoが完全なHTMLドキュメントをどのように認識しているか調査
   - レイアウト解決のロジックを理解する

2. **Hugoのバージョンアップまたはダウングレード**
   - 別のバージョンのHugoで試す
   - 特に、`layouts/diary/list.html`が正常に動作していた時点のHugoバージョンを確認

3. **ワークアラウンドの実装**
   - `layouts/tweet/list.html`を`{{ define }}`ブロック形式に変更し、`baseof.html`と組み合わせて使用する
   - ただし、これはリダイレクトページとしては機能しない
   - または、`baseof.html`でTweetリストページを条件判定してリダイレクトを実装する（既に実装済み）

4. **Hugoコミュニティへの報告**
   - この問題をHugoのGitHubリポジトリに報告し、開発者に確認してもらう

5. **Tweet固有の設定の影響を調査**
   - `tweet_place`タクソノミーを一時的に無効化してテスト
   - `layouts/tweet_place/term.html`を一時的に削除してテスト
   - これらの変更が問題に影響を与えるか確認

## 重要な実験結果（2025-12-01 23:30）

### セクション名変更実験

`tweet`というセクション名を`tweet2`に変更して実験を行った結果：

#### 実験設定
- `content/tweet2/_index.md`を作成（`layout: "list"`を指定）
- `layouts/tweet2/list.html`を作成（`layouts/tweet/list.html`と同じ構造、セクション名のみ`tweet2`に変更）
- Hugoでビルドして生成されたファイルを確認

#### 実験結果

**`tweet2`セクション（正常に動作）:**
- `public/tweet2/index.html`: **23行**
- 完全なHTMLリダイレクトページとして正しく生成されている
- `baseof.html`でラップされていない
- `<!DOCTYPE html>`から始まり、`<html>`, `<head>`, `<body>`を含む完全なHTMLドキュメント

**`tweet`セクション（問題あり）:**
- `public/tweet/index.html`: **364行**
- `baseof.html`でラップされている（`<!DOCTYPE html><html lang="en">`から始まる）
- リダイレクトコードが含まれていない
- `layout-header`と`layout-tags`が空
- Tweet記事のリストが表示されている（`article-container tweet-container`）

**`diary`セクション（正常に動作）:**
- `public/diary/index.html`: **63行**
- 完全なHTMLリダイレクトページとして正しく生成されている
- `baseof.html`でラップされていない

### 結論

**「tweet」というセクション名自体が問題の原因である可能性が非常に高い。**

- `tweet2`では正常に動作している
- `diary`では正常に動作している
- `tweet`だけが問題を発生させている

これは、Hugoが「tweet」という名前を特別に扱っている可能性を示唆しています。

### 可能性のある原因

1. **Hugoの内部で「tweet」が予約語または特別な名前として扱われている**
   - Hugoのソースコードで「tweet」が特別な処理を受けている可能性
   - レイアウト解決のロジックで「tweet」が特別に扱われている可能性

2. **Hugoのバグ**
   - 特定のセクション名（「tweet」）で完全なHTMLドキュメントが認識されないバグ
   - レイアウト解決の順序が「tweet」セクションで異なる動作をするバグ

3. **設定ファイルの影響**
   - `config.toml`の`[permalinks]`セクションで`tweet = "/tweet/:slug/"`が定義されている
   - これがレイアウト解決に影響を与えている可能性

### 次の調査ステップ

1. **Hugoのソースコード調査**
   - HugoのGitHubリポジトリで「tweet」が特別に扱われている箇所を検索
   - レイアウト解決のロジックを確認

2. **Hugoコミュニティへの報告**
   - この問題をHugoのGitHubリポジトリに報告
   - 「tweet」というセクション名で完全なHTMLドキュメントが認識されない問題として報告

3. **ワークアラウンド**
   - セクション名を「tweet」から別の名前に変更する（例：`microblog`、`notes`、`posts`）
   - ただし、これは既存のURL構造に影響を与えるため、慎重に検討する必要がある

## プロジェクト固有の問題かHugoのバグかの確認（2025-12-01 23:50）

### 調査目的

この問題がプロジェクト固有の問題（プロジェクト内の設定やコードが原因）なのか、Hugoのバグなのかを確認するため、プロジェクト内で「tweet」セクションに対して`list.html`を無視して`baseof.html`を強制的に使用する処理が存在するかを調査しました。

### 調査結果

#### 1. `layouts/_default/`ディレクトリの確認

**結果**: 「tweet」セクションに対して特別な処理を行うファイルは見当たりませんでした。

- `layouts/_default/list.html`: **存在しない**
- `layouts/_default/section.html`: **存在しない**
- `layouts/_default/taxonomy.html`: 存在するが、`{{ define "main" }}`ブロック形式で、すべてのタクソノミーに適用される汎用的なテンプレート
- `layouts/_default/term.html`: 存在するが、`{{ define "main" }}`ブロック形式で、すべてのタクソノミーに適用される汎用的なテンプレート
- `layouts/_default/baseof.html`: 「tweet」セクションに対する特別な処理は見当たらない（「diary」セクションに対する処理はあるが、これは`.IsPage`の条件付きで、セクション一覧ページには影響しない）

#### 2. `baseof.html`の確認

**結果**: 「tweet」セクションに対して特別な処理は見当たりませんでした。

- `baseof.html`内で「tweet」セクションを条件分岐している箇所は存在しない
- 「diary」セクションに対する処理はあるが、これは`.IsPage`の条件付きで、セクション一覧ページ（`.IsSection`）には影響しない

#### 3. 設定ファイルの確認

**結果**: 通常の設定のみで、特別な処理は見当たりませんでした。

- `config.toml`:
  - `[taxonomies]`セクションで`tweet_tag`、`tweet_month`、`tweet_place`が定義されている（通常の設定）
  - `[permalinks]`セクションで`tweet = "/tweet/:slug/"`が定義されている（通常の設定）
- `cloudcannon.config.yml`:
  - `tweet`コレクションが定義されている（通常の設定）

#### 4. レイアウトファイルの比較

**結果**: `layouts/diary/list.html`と`layouts/tweet/list.html`は構造的に完全に同一です。

- 両方とも完全なHTMLドキュメント（`<!DOCTYPE html>`から始まる）
- 唯一の違いは、セクション名（`diary` vs `tweet`）とタクソノミー名（`diary_month` vs `tweet_month`）
- `diff`コマンドで比較した結果、セクション名とタクソノミー名のみが異なる

#### 5. 他のセクションとの比較

**結果**: 他のセクション（`work`、`column`）は`{{ define }}`ブロック形式で`baseof.html`を使用しています。

- `layouts/work/list.html`: `{{ define "main" }}`ブロック形式
- `layouts/column/list.html`: `{{ define "main" }}`ブロック形式
- `layouts/diary/list.html`: 完全なHTMLドキュメント（正常に動作）
- `layouts/tweet/list.html`: 完全なHTMLドキュメント（問題が発生）

### 結論

**プロジェクト内には「tweet」セクションに対して`list.html`を無視して`baseof.html`を強制的に使用する処理は見当たりません。**

- `layouts/_default/`ディレクトリ内に「tweet」セクションに対する特別な処理を行うファイルは存在しない
- `baseof.html`内に「tweet」セクションに対する特別な処理は存在しない
- 設定ファイルに「tweet」セクションに対する特別な設定は存在しない
- `layouts/diary/list.html`と`layouts/tweet/list.html`は構造的に完全に同一なのに、`diary`は正常に動作し、`tweet`は動作しない

**したがって、この問題はHugoのバグである可能性が非常に高いです。**

### 推奨される対応

1. **Hugoコミュニティへの報告**
   - この問題をHugoのGitHubリポジトリにIssueとして報告
   - 再現手順、環境情報、実験結果（`tweet2`では正常に動作、プロジェクト内に特別な処理は存在しない）を含めて報告

2. **ワークアラウンドの実装**
   - `baseof.html`で「tweet」セクションの一覧ページ（`/tweet/`）を検出してリダイレクト処理を実装
   - これにより、`layouts/tweet/list.html`が無視されても、`baseof.html`経由でリダイレクトが機能する

## Hugoの内部調査結果（2025-12-01 23:45）

### 調査方法

1. **Web検索による調査**
   - Hugoの公式ドキュメント
   - Hugoのコミュニティフォーラム
   - HugoのGitHubリポジトリ
   - Hugoのバグトラッカー

2. **プロジェクト内の調査**
   - `layouts/`ディレクトリ内で「tweet」が特別に扱われている箇所の確認
   - `config.toml`での「tweet」関連設定の確認

### 調査結果

#### 1. Hugoの予約語について

**結果**: 「tweet」というセクション名がHugoの予約語として扱われているという情報は見つかりませんでした。

- Hugoの公式ドキュメントには「tweet」が予約語として記載されていない
- Hugoのコミュニティフォーラムでも「tweet」が予約語であるという報告は見当たらない
- HugoのGitHubリポジトリでも「tweet」が特別に扱われている箇所は確認できなかった

#### 2. Hugoのバグについて

**結果**: 「tweet」というセクション名に関連する既知のバグ報告は見つかりませんでした。

- HugoのGitHubのIssueトラッカーで「tweet」セクション名に関連する既知のバグ報告は確認できなかった
- 同様の問題が報告されているIssueも見当たらなかった

#### 3. プロジェクト内の調査結果

**結果**: プロジェクト内では「tweet」は通常のセクション名として使用されています。

- `layouts/tweet/`ディレクトリ内のファイルは通常のセクション用のレイアウトファイル
- `config.toml`の`[permalinks]`セクションで`tweet = "/tweet/:slug/"`が定義されているが、これは通常の設定
- `layouts/partials/sidebar.html`で`/tweet/`へのリンクが定義されているが、これも通常の使用

#### 4. Hugoのバージョン情報

- **現在のバージョン**: Hugo v0.152.2+extended+withdeploy
- **ビルド日**: 2025-10-24T15:31:49Z
- **プラットフォーム**: darwin/amd64
- **インストール方法**: Homebrew

### 考察

実験結果（`tweet2`では正常に動作し、`tweet`では問題が発生）と調査結果（公式ドキュメントやバグ報告では「tweet」が特別扱いされているという情報がない）を合わせると、以下の可能性が考えられます：

1. **Hugoの未報告のバグ**
   - 特定のセクション名（「tweet」）で完全なHTMLドキュメントが認識されないバグが存在するが、まだ報告されていない
   - このバグは特定の条件下でのみ発生するため、多くのユーザーが気づいていない可能性

2. **Hugoの内部実装の特殊性**
   - Hugoのレイアウト解決の内部実装で、「tweet」という名前が何らかの理由で特別に扱われている可能性
   - ただし、これは公式ドキュメントには記載されていない

3. **設定や環境の影響**
   - 特定の設定や環境の組み合わせで、「tweet」というセクション名が問題を引き起こす可能性
   - ただし、`tweet2`では正常に動作するため、セクション名自体が原因である可能性が高い

### 推奨される次のステップ

1. **Hugoコミュニティへの報告**
   - この問題をHugoのGitHubリポジトリにIssueとして報告
   - 再現手順、環境情報、実験結果（`tweet2`では正常に動作）を含めて報告
   - タイトル例: "Section name 'tweet' causes layout resolution issue - standalone HTML template not recognized"

2. **Hugoのバージョンアップテスト**
   - 最新のHugoバージョンで問題が解消されるか確認
   - ただし、現在使用しているHugo 0.152.2は比較的新しいバージョン

3. **ワークアラウンドの検討**
   - セクション名を「tweet」から別の名前に変更する（例：`microblog`、`notes`、`posts`）
   - ただし、これは既存のURL構造に影響を与えるため、慎重に検討する必要がある
   - リダイレクト設定を追加して、既存のURLを新しいURLにリダイレクトする必要がある

