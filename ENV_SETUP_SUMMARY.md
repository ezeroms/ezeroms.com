# 環境変数設定サマリー

## 📋 設定が必要な環境変数

以下の環境変数をNetlifyに設定してください：

### Netlify環境変数設定

| 変数名 | 値 |
|--------|-----|
| `CONTENTFUL_SPACE_ID` | `dis3d5w8snuc` |
| `CONTENTFUL_ENVIRONMENT` | `master` |
| `CONTENTFUL_ACCESS_TOKEN` | `dJCYPiTJ3BmgM1i-sxN-PaqceCNlgpl6H6k5Zk72kQU` |
| `CONTENTFUL_PREVIEW_TOKEN` | `CZvaNRAwLJufOCjMEJo4oJGl6Shu4MD2So4FlxrGcPk` |

## 🚀 クイック設定手順

### Netlifyでの設定
1. Netlifyダッシュボード → サイト選択 → **Site configuration** → **Environment variables**
2. 上記の4つの環境変数を追加
3. ビルドを再実行して動作確認

### ローカル開発用（オプション）
プロジェクトルートに`.env`ファイルを作成：

```bash
CONTENTFUL_SPACE_ID=dis3d5w8snuc
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_ACCESS_TOKEN=dJCYPiTJ3BmgM1i-sxN-PaqceCNlgpl6H6k5Zk72kQU
CONTENTFUL_PREVIEW_TOKEN=CZvaNRAwLJufOCjMEJo4oJGl6Shu4MD2So4FlxrGcPk
```

⚠️ `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません。

## 📚 詳細ドキュメント

- Netlify環境変数設定: `NETLIFY_ENV_VARS_SETUP.md`
- Webhook設定: `WEBHOOK_SETUP_GUIDE.md`

