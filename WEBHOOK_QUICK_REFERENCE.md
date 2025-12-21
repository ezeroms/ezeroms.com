# Webhook設定 クイックリファレンス 🚀

## 📍 重要な情報

### コンテンツタイプID（Contentful）
- **Column**: `21x9qoYgM1TRew9Oagxt8s`
- **Diary**: `2Kymz8f5lsk5BSap6oSM9L`
- **Shoulders of Giants**: `3iZ9V9Emr1bFMBMKGYsCCB`

### Netlifyビルドコマンド
```bash
rm -rf public && cd scripts && npm install && cd .. && node scripts/contentful-to-markdown.js && hugo --gc --minify
```

## 🔗 必要なURL

### Netlify
- ダッシュボード: https://app.netlify.com/
- ビルドフック設定: `Site configuration` → `Build & deploy` → `Build hooks`

### Contentful
- ダッシュボード: https://app.contentful.com/
- Webhook設定: `Settings` → `Webhooks`

## ⚙️ 推奨設定

### Netlifyビルドフック
- **Name**: `Contentful Webhook`
- **Branch**: `main`（またはデフォルトブランチ）

### Contentful Webhook
- **Name**: `Netlify Build Trigger`
- **URL**: NetlifyのビルドフックURL
- **Trigger**: `Entry.publish`（エントリが公開されたとき）
- **Content types**: 
  - Column (`21x9qoYgM1TRew9Oagxt8s`)
  - Diary (`2Kymz8f5lsk5BSap6oSM9L`)
  - Shoulders of Giants (`3iZ9V9Emr1bFMBMKGYsCCB`)

## ✅ 動作確認方法

1. Contentfulで任意のエントリを更新・公開
2. Netlifyの「Deploys」タブでビルドが開始されることを確認
3. ビルドが完了したら、サイトに変更が反映されていることを確認

## 🔍 トラブルシューティング

### Webhookが動作しない
1. NetlifyのビルドフックURLが正しいか確認
2. ContentfulのWebhookが有効になっているか確認
3. 正しいコンテンツタイプが選択されているか確認

### ビルドが失敗する
1. Netlifyの環境変数を確認：
   - `CONTENTFUL_SPACE_ID`
   - `CONTENTFUL_ACCESS_TOKEN` または `CONTENTFUL_PREVIEW_TOKEN`
2. ビルドログでエラーを確認
3. コンテンツタイプIDが正しいか確認

## 📚 詳細ドキュメント

- 詳細な設定手順: `WEBHOOK_SETUP_GUIDE.md`
- チェックリスト: `WEBHOOK_SETUP_CHECKLIST.md`

