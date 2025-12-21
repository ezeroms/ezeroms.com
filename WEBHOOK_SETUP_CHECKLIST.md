# Webhook設定チェックリスト ✅

## 📋 設定前の確認

- [ ] Netlifyアカウントにログインできる
- [ ] Contentfulアカウントにログインできる
- [ ] 管理者権限がある

## 🔧 ステップ1: NetlifyのビルドフックURLを取得

- [ ] Netlifyダッシュボードにアクセス
- [ ] サイト（`ezeroms.com`）を選択
- [ ] 「Site configuration」→「Build & deploy」→「Build hooks」に移動
- [ ] 「Add build hook」をクリック
- [ ] 以下の情報を入力：
  - [ ] Name: `Contentful Webhook`
  - [ ] Branch: `main`（またはデフォルトブランチ）
- [ ] 「Save」をクリック
- [ ] **Webhook URLをコピー**（重要: 一度しか表示されない）
- [ ] URLを安全な場所に保存

**コピーしたURL**: `_________________________________________________`

## 🔧 ステップ2: ContentfulでWebhookを設定

- [ ] Contentfulダッシュボードにアクセス
- [ ] 対象のスペースを選択
- [ ] 「Settings」→「Webhooks」に移動
- [ ] 「Add webhook」をクリック
- [ ] 基本設定：
  - [ ] Name: `Netlify Build Trigger`
  - [ ] URL: 上記でコピーしたNetlifyのビルドフックURLを貼り付け
- [ ] トリガー設定：
  - [ ] 「What to trigger」で `Entry.publish` を選択（推奨）
- [ ] コンテンツタイプのフィルタリング：
  - [ ] 「Which content should trigger this webhook?」で「Specific content types」を選択
  - [ ] 以下の3つを選択：
    - [ ] Column (`21x9qoYgM1TRew9Oagxt8s`)
    - [ ] Diary (`2Kymz8f5lsk5BSap6oSM9L`)
    - [ ] Shoulders of Giants (`3iZ9V9Emr1bFMBMKGYsCCB`)
- [ ] 「Save」をクリック

## ✅ ステップ3: 動作確認

- [ ] Contentfulで任意のエントリ（Column、Diary、Shoulders of Giantsのいずれか）を開く
- [ ] 小さな変更を加える（例: タイトルに「(test)」を追加）
- [ ] 「Publish」をクリックして公開
- [ ] Netlifyのダッシュボードで「Deploys」タブを確認
- [ ] 数秒以内に新しいビルドが開始されることを確認
- [ ] ビルドログに `node scripts/contentful-to-markdown.js` が実行されることを確認
- [ ] ビルドが完了するまで待つ（通常2-5分）
- [ ] ステータスが「Published」になることを確認
- [ ] サイトにアクセスして、変更が反映されていることを確認
- [ ] テスト用の変更を元に戻す

## 🎉 完了

- [ ] Webhookが正常に動作している
- [ ] Contentfulで更新すると自動的にNetlifyのビルドがトリガーされる

---

## 📝 メモ

### NetlifyビルドフックURL
```
_________________________________________________
```

### Contentful Webhook設定
- Webhook名: `_________________________________`
- トリガー: `_________________________________`
- 対象コンテンツタイプ: `_________________________________`

### テスト結果
- テスト日時: `_________________________________`
- 結果: `_________________________________`
- 備考: `_________________________________`

---

## 🆘 問題が発生した場合

詳細なトラブルシューティングは `WEBHOOK_SETUP_GUIDE.md` を参照してください。

