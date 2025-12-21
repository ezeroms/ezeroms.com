# Webhook設定ガイド - Contentful → Netlify

Contentfulでコンテンツを更新した際に、自動的にNetlifyのビルドをトリガーするためのWebhook設定手順です。

## 📋 前提条件

- Netlifyアカウントにログインできること
- Contentfulアカウントにログインできること
- 管理者権限があること

## 🔧 ステップ1: NetlifyのビルドフックURLを取得

### 1-1. Netlifyダッシュボードにアクセス
1. [Netlify](https://app.netlify.com/)にログイン
2. 対象のサイト（`ezeroms.com`）を選択

### 1-2. ビルドフックを作成
1. サイトのダッシュボードで、左サイドバーの **「Site configuration」** をクリック
2. **「Build & deploy」** をクリック
3. 下にスクロールして **「Build hooks」** セクションを見つける
4. **「Add build hook」** ボタンをクリック

### 1-3. ビルドフックの設定
以下の情報を入力：

- **Name**: `Contentful Webhook`（任意の名前）
- **Branch**: `main`（またはデフォルトブランチ）
- **Build command**: （空欄のまま - `netlify.toml`の設定を使用）

### 1-4. ビルドフックURLをコピー
1. **「Save」** をクリック
2. 生成された **Webhook URL** をコピー
   - 形式: `https://api.netlify.com/build_hooks/xxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **このURLは一度しか表示されないため、必ずコピーしてください**

### 1-5. ビルドフックURLを保存
コピーしたURLを安全な場所に保存してください（次のステップで使用します）。

---

## 🔧 ステップ2: ContentfulでWebhookを設定

### 2-1. Contentfulダッシュボードにアクセス
1. [Contentful](https://app.contentful.com/)にログイン
2. 対象のスペースを選択

### 2-2. Webhook設定画面を開く
1. 上部メニューの **「Settings」** をクリック
2. 左サイドバーの **「Webhooks」** をクリック
3. **「Add webhook」** ボタンをクリック

### 2-3. Webhookの基本設定
以下の情報を入力：

- **Name**: `Netlify Build Trigger`（任意の名前）
- **URL**: ステップ1-4でコピーしたNetlifyのビルドフックURLを貼り付け

### 2-4. トリガー設定
**「What to trigger」** セクションで、以下のいずれかを選択：

#### 推奨設定: `Entry.publish`（エントリが公開されたとき）
- ✅ エントリが公開されたときのみビルドをトリガー
- ✅ 下書きの保存ではビルドがトリガーされない（無駄なビルドを防ぐ）

#### その他のオプション:
- `Entry.unpublish` - エントリが非公開になったとき
- `Entry.save` - エントリが保存されたとき（下書きも含む）⚠️ 頻繁にビルドがトリガーされる可能性あり

### 2-5. コンテンツタイプのフィルタリング
**「Which content should trigger this webhook?」** セクションで：

1. **「Specific content types」** を選択
2. 以下の3つのコンテンツタイプを選択：
   - ✅ **Column** (`21x9qoYgM1TRew9Oagxt8s`)
   - ✅ **Diary** (`2Kymz8f5lsk5BSap6oSM9L`)
   - ✅ **Shoulders of Giants** (`3iZ9V9Emr1bFMBMKGYsCCB`)

### 2-6. Webhookを保存
1. 設定を確認
2. **「Save」** をクリック

---

## ✅ ステップ3: 動作確認

### 3-1. テスト用エントリを更新
1. Contentfulで任意のエントリ（Column、Diary、Shoulders of Giantsのいずれか）を開く
2. 小さな変更を加える（例: タイトルに「(test)」を追加）
3. **「Publish」** をクリックして公開

### 3-2. Netlifyでビルドを確認
1. Netlifyのダッシュボードに戻る
2. サイトのダッシュボードで **「Deploys」** タブを確認
3. 数秒以内に新しいビルドが開始されることを確認
   - ステータスが **「Building」** になる
   - ビルドログに `node scripts/contentful-to-markdown.js` が実行されることを確認

### 3-3. ビルド完了を確認
1. ビルドが完了するまで待つ（通常2-5分）
2. ステータスが **「Published」** になることを確認
3. サイトにアクセスして、変更が反映されていることを確認

### 3-4. テスト用の変更を元に戻す
1. Contentfulでテスト用の変更を元に戻す
2. 再度公開して、正常に動作することを確認

---

## 🔍 トラブルシューティング

### Webhookが動作しない場合

#### 1. NetlifyのビルドフックURLを確認
- URLが正しくコピーされているか確認
- URLに余分なスペースや改行が含まれていないか確認

#### 2. ContentfulのWebhook設定を確認
- Webhookが有効になっているか確認（「Active」になっているか）
- 正しいコンテンツタイプが選択されているか確認
- トリガー設定（`Entry.publish`など）が正しいか確認

#### 3. Netlifyのビルドログを確認
- Netlifyのダッシュボードでビルドログを確認
- エラーメッセージがないか確認
- `contentful-to-markdown.js`が正常に実行されているか確認

#### 4. ContentfulのWebhookログを確認
- ContentfulのWebhook設定画面で **「Recent deliveries」** を確認
- リクエストが送信されているか確認
- エラーレスポンスがないか確認

### ビルドが失敗する場合

#### 1. 環境変数の確認
- Netlifyの環境変数に以下が設定されているか確認：
  - `CONTENTFUL_SPACE_ID`
  - `CONTENTFUL_ACCESS_TOKEN` または `CONTENTFUL_PREVIEW_TOKEN`
  - `CONTENTFUL_ENVIRONMENT`（オプション、デフォルトは`master`）

#### 2. ビルドログの確認
- Netlifyのビルドログでエラーメッセージを確認
- `contentful-to-markdown.js`の実行時のエラーを確認

#### 3. コンテンツタイプIDの確認
- `scripts/contentful-to-markdown.js`で使用されているコンテンツタイプIDが正しいか確認

---

## 📝 現在の設定

### コンテンツタイプID
- **Column**: `21x9qoYgM1TRew9Oagxt8s`
- **Diary**: `2Kymz8f5lsk5BSap6oSM9L`
- **Shoulders of Giants**: `3iZ9V9Emr1bFMBMKGYsCCB`

### Netlifyビルドコマンド
```bash
rm -rf public && cd scripts && npm install && cd .. && node scripts/contentful-to-markdown.js && hugo --gc --minify
```

---

## 💡 補足情報

### Webhookの動作フロー
1. Contentfulでエントリを公開
2. ContentfulがWebhookをNetlifyに送信
3. Netlifyがビルドを開始
4. `contentful-to-markdown.js`が実行され、Contentfulから最新のコンテンツを取得
5. Markdownファイルが生成される
6. Hugoがサイトをビルド
7. サイトがデプロイされる

### ビルド時間
- 通常のビルド時間: 2-5分
- Contentfulからコンテンツを取得する時間: 数秒〜数十秒
- Hugoのビルド時間: 1-3分

### 注意事項
- Webhookが設定されていない場合、Contentfulで更新しても自動的にビルドはトリガーされません
- 手動でビルドをトリガーする場合は、Netlifyのダッシュボードから「Trigger deploy」をクリック
- ビルド中はサイトが一時的に古いバージョンになる可能性があります

---

## 🆘 サポート

問題が解決しない場合は、以下を確認してください：

1. NetlifyとContentfulの両方のログを確認
2. 環境変数が正しく設定されているか確認
3. コンテンツタイプIDが正しいか確認
4. ビルドコマンドが正しく実行されているか確認

