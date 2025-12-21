# Contentful Webhook設定ガイド

## 概要
Contentfulでコンテンツを更新した際に、自動的にNetlifyのビルドをトリガーするためのWebhook設定方法です。

## 現在の設定状況

### コンテンツタイプID
以下のコンテンツタイプIDが`scripts/contentful-to-markdown.js`で使用されています：

- **Column**: `21x9qoYgM1TRew9Oagxt8s` (システムID)
- **Diary**: `2Kymz8f5lsk5BSap6oSM9L` (システムID)
- **Shoulders of Giants**: `3iZ9V9Emr1bFMBMKGYsCCB` (システムID)

### Netlifyビルド設定
`netlify.toml`で以下のビルドコマンドが設定されています：
```toml
command = "rm -rf public && cd scripts && npm install && cd .. && node scripts/contentful-to-markdown.js && hugo --gc --minify"
```

これにより、ビルド時にContentfulから最新のコンテンツを取得してMarkdownファイルを生成します。

## Webhook設定手順

### 1. NetlifyのビルドフックURLを取得
1. Netlifyのダッシュボードにログイン
2. サイトの設定 → Build & deploy → Build hooks
3. 「Add build hook」をクリック
4. 名前を入力（例: "Contentful Webhook"）
5. ブランチを選択（通常は`main`または`master`）
6. 「Save」をクリック
7. 生成されたWebhook URLをコピー（例: `https://api.netlify.com/build_hooks/xxxxxxxxxxxxxxxxxxxx`）

### 2. ContentfulでWebhookを設定
1. Contentfulのダッシュボードにログイン
2. Settings → Webhooks
3. 「Add webhook」をクリック
4. 以下の設定を行う：
   - **Name**: "Netlify Build Trigger"（任意の名前）
   - **URL**: 上記で取得したNetlifyのビルドフックURL
   - **Content type**: 以下のいずれかを選択：
     - `Entry.publish` - エントリが公開されたとき
     - `Entry.unpublish` - エントリが非公開になったとき
     - `Entry.save` - エントリが保存されたとき（下書きも含む）
   - **Content types**: 以下のコンテンツタイプを選択：
     - Column (`21x9qoYgM1TRew9Oagxt8s`)
     - Diary (`2Kymz8f5lsk5BSap6oSM9L`)
     - Shoulders of Giants (`3iZ9V9Emr1bFMBMKGYsCCB`)
5. 「Save」をクリック

### 3. 動作確認
1. Contentfulで任意のエントリを更新・公開
2. Netlifyのダッシュボードで新しいビルドが開始されることを確認
3. ビルドが完了したら、サイトに変更が反映されていることを確認

## 注意事項

- Webhookが設定されていない場合、Contentfulで更新しても自動的にビルドはトリガーされません
- 手動でビルドをトリガーする場合は、Netlifyのダッシュボードから「Trigger deploy」をクリック
- ビルドには数分かかる場合があります

## トラブルシューティング

### Webhookが動作しない場合
1. NetlifyのビルドフックURLが正しいか確認
2. ContentfulのWebhook設定で正しいコンテンツタイプが選択されているか確認
3. Netlifyのビルドログを確認してエラーがないか確認

### ビルドが失敗する場合
1. `scripts/contentful-to-markdown.js`のエラーログを確認
2. ContentfulのAPIトークンが正しく設定されているか確認（`.env`ファイル）
3. コンテンツタイプIDが正しいか確認

