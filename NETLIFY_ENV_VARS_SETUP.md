# Netlify環境変数設定ガイド

## 📋 概要
Netlifyでビルド時にContentfulからコンテンツを取得するために、環境変数を設定する必要があります。

## 🔧 設定手順

### 1. Netlifyダッシュボードにアクセス
1. [Netlify](https://app.netlify.com/)にログイン
2. 対象のサイト（`ezeroms.com`）を選択

### 2. 環境変数設定画面を開く
1. サイトのダッシュボードで、左サイドバーの **「Site configuration」** をクリック
2. **「Environment variables」** をクリック

### 3. 環境変数を追加
以下の環境変数を追加してください：

#### 必須の環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `CONTENTFUL_SPACE_ID` | `dis3d5w8snuc` | ContentfulのSpace ID |
| `CONTENTFUL_ENVIRONMENT` | `master` | ContentfulのEnvironment ID |
| `CONTENTFUL_ACCESS_TOKEN` | `dJCYPiTJ3BmgM1i-sxN-PaqceCNlgpl6H6k5Zk72kQU` | Content Delivery API - access token |

#### オプションの環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `CONTENTFUL_PREVIEW_TOKEN` | `CZvaNRAwLJufOCjMEJo4oJGl6Shu4MD2So4FlxrGcPk` | Content Preview API - access token（未公開コンテンツも取得する場合） |

### 4. 環境変数の追加方法
1. **「Add a variable」** ボタンをクリック
2. **「Key」** に変数名を入力（例: `CONTENTFUL_SPACE_ID`）
3. **「Value」** に値を入力（例: `dis3d5w8snuc`）
4. **「Scopes」** で適用範囲を選択：
   - ✅ **All scopes** - すべてのビルドで使用（推奨）
   - または特定のブランチやデプロイプレビューに限定
5. **「Save」** をクリック

### 5. すべての環境変数を追加
上記の手順を繰り返して、以下の環境変数をすべて追加してください：

```
CONTENTFUL_SPACE_ID=dis3d5w8snuc
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_ACCESS_TOKEN=dJCYPiTJ3BmgM1i-sxN-PaqceCNlgpl6H6k5Zk72kQU
CONTENTFUL_PREVIEW_TOKEN=CZvaNRAwLJufOCjMEJo4oJGl6Shu4MD2So4FlxrGcPk
```

## ✅ 設定確認

### 1. 環境変数が正しく設定されているか確認
1. Netlifyの環境変数設定画面で、追加した変数が表示されているか確認
2. 値が正しく設定されているか確認

### 2. ビルドをテスト
1. Netlifyのダッシュボードで **「Trigger deploy」** → **「Deploy site」** をクリック
2. ビルドログを確認
3. `contentful-to-markdown.js`が正常に実行されているか確認
4. エラーがないか確認

### 3. ビルドログの確認ポイント
以下のようなログが表示されれば正常です：
```
Fetching column entries from Contentful...
Found X column entries.
Fetching diary entries from Contentful...
Found X diary entries.
Fetching shoulders-of-giants entries from Contentful...
Found X shoulders-of-giants entries.
```

## 🔍 トラブルシューティング

### 環境変数が認識されない場合
1. 変数名が正しいか確認（大文字小文字を区別）
2. 値に余分なスペースや改行が含まれていないか確認
3. 「Save」をクリックしたか確認
4. ビルドを再実行

### ビルドが失敗する場合
1. ビルドログでエラーメッセージを確認
2. 環境変数が正しく設定されているか確認
3. ContentfulのAPIトークンが有効か確認
4. Space IDとEnvironment IDが正しいか確認

### Contentful APIエラーが発生する場合
1. APIトークンが有効か確認
2. トークンに必要な権限があるか確認
3. Space IDが正しいか確認
4. Environment IDが正しいか確認（通常は`master`）

## 📝 注意事項

- 環境変数は機密情報のため、Gitリポジトリにコミットしないでください
- `.env`ファイルは`.gitignore`に含まれています
- Netlifyの環境変数は暗号化されて保存されます
- 環境変数を変更した後は、ビルドを再実行する必要があります

## 🔐 セキュリティ

- APIトークンは定期的に更新することを推奨します
- 不要になったトークンは削除してください
- トークンは他人と共有しないでください

