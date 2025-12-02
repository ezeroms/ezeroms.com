# Hugoバグ報告ガイド

## 報告先

Hugoのバグ報告は、GitHubのIssueトラッカーで行います。

- **GitHubリポジトリ**: https://github.com/gohugoio/hugo
- **Issue作成ページ**: https://github.com/gohugoio/hugo/issues/new

## 報告手順

### 1. 既存のIssueを確認

報告前に、既存のIssueで同様の問題が報告されていないか確認してください。

- HugoのGitHubリポジトリの「Issues」タブを開く
- 検索ボックスで「tweet section layout」や「standalone HTML template」などで検索
- 同様の問題が報告されていないか確認

### 2. 新しいIssueを作成

1. https://github.com/gohugoio/hugo/issues/new にアクセス
2. GitHubアカウントでログイン（必要に応じてアカウントを作成）
3. Issueタイトルを入力
   - 例: `Section name "tweet" causes standalone HTML template (list.html) to be ignored`

### 3. Issue本文を記入

`docs/hugo-bug-report-template.md`の内容をコピーして、Issue本文に貼り付けます。

### 4. ラベルの確認

Hugoのリポジトリでは、通常以下のラベルが自動的に付与されます：
- `bug` - バグ報告の場合
- `needs-triage` - 初期の分類が必要な場合

必要に応じて、開発者が適切なラベルを追加します。

### 5. Issueを送信

「Submit new issue」ボタンをクリックしてIssueを作成します。

## 報告内容のポイント

### 必須情報

1. **問題の概要**
   - 何が起こっているか
   - 何が期待される動作か

2. **再現手順**
   - ステップバイステップで再現できる手順
   - 最小限の再現例があると良い

3. **環境情報**
   - Hugoのバージョン（`hugo version`の出力）
   - OSとプラットフォーム
   - インストール方法

4. **実際の動作と期待される動作**
   - 現在何が起こっているか
   - 何が起こるべきか

### 推奨される追加情報

1. **最小限の再現例**
   - 問題を再現できる最小限のHugoサイト
   - GitHubのGistやリポジトリへのリンク

2. **ログやエラーメッセージ**
   - `hugo --verbose`や`hugo --debug`の出力
   - エラーメッセージがある場合

3. **関連するファイル**
   - 問題に関連するレイアウトファイルや設定ファイル
   - コードスニペット

4. **調査結果**
   - 既に試したこと
   - 調査結果や仮説

## 報告後の対応

### 1. フィードバックを待つ

- Hugoの開発者やコミュニティメンバーからのコメントを待ちます
- 質問や追加情報の要求がある場合は、できるだけ早く対応します

### 2. 追加情報の提供

- 必要に応じて、追加の情報やファイルを提供します
- 最小限の再現例を作成して共有することも有効です

### 3. Issueの更新

- 問題が解決した場合や、追加情報が見つかった場合は、Issueを更新します
- ワークアラウンドが見つかった場合も共有します

## 注意事項

1. **英語で報告**
   - HugoのIssueトラッカーは英語で運用されています
   - 可能な限り英語で報告してください

2. **礼儀正しく**
   - コミュニティメンバーに対して礼儀正しく、建設的なコミュニケーションを心がけます

3. **詳細な情報を提供**
   - 問題を再現するために必要な情報をできるだけ詳しく提供します

4. **既存のIssueを確認**
   - 報告前に既存のIssueを確認し、重複を避けます

## 参考リンク

- Hugo GitHubリポジトリ: https://github.com/gohugoio/hugo
- Hugo公式フォーラム: https://discourse.gohugo.io/
- Hugoドキュメント: https://gohugo.io/documentation/

