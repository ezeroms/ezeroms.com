# Contentful コンテンツタイプID移行ガイド

## 現在の状況

- `diary` = Columnコンテンツ（23件）
- `tweet` = Diaryコンテンツ（26件）
- `shouldersOfGiants` = Shoulders of Giantsコンテンツ（289件）

## 目標

- `column` = Columnコンテンツ
- `diary` = Diaryコンテンツ
- `shoulders_of_giants` = Shoulders of Giantsコンテンツ

## 移行手順

### 1. Contentful Web Appで新しいコンテンツタイプを作成

#### Columnコンテンツタイプの作成

1. Contentful Web App > Content model > Add content type
2. Name: `Column`
3. API Identifier: `column`
4. 以下のフィールドを追加（既存の`diary`コンテンツタイプからコピー）:
   - `title` (Short text, Required)
   - `slug` (Short text, Required, Unique)
   - `date` (Date & time, Required)
   - `column_month` (Short text)
   - `body` (Rich text, Required)
   - `column_category` (Short text, Multiple values)
   - `column_tag` (Short text, Multiple values)

#### Diaryコンテンツタイプの作成

1. Contentful Web App > Content model > Add content type
2. Name: `Diary`
3. API Identifier: `diary`
4. 以下のフィールドを追加（既存の`tweet`コンテンツタイプからコピー）:
   - `slug` (Short text, Required, Unique)
   - `date` (Date & time, Required)
   - `diary_month` (Short text, Required)
   - `body` (Rich text, Required)
   - `diary_tag` (Short text, Multiple values)
   - `diary_place` (Short text)
   - `voice_type` (Short text, Multiple values)

#### Shoulders of Giantsコンテンツタイプの作成

1. Contentful Web App > Content model > Add content type
2. Name: `Shoulders of Giants`
3. API Identifier: `shoulders_of_giants`
4. 以下のフィールドを追加（既存の`shouldersOfGiants`コンテンツタイプからコピー）:
   - `slug` (Short text, Required, Unique)
   - `body` (Rich text, Required)
   - `topic` (Short text, Multiple values)
   - `book_title` (Short text)
   - `author` (Short text)
   - `publisher` (Short text)
   - `published_year` (Short text)
   - `citation_override` (Short text)

### 2. エントリを移行

新しいコンテンツタイプを作成したら、以下のコマンドでエントリを移行します:

```bash
node scripts/migrate-content-types.js
```

このスクリプトは:
- `diary`コンテンツタイプのエントリを`column`にコピー
- `tweet`コンテンツタイプのエントリを`diary`にコピー
- `shouldersOfGiants`コンテンツタイプのエントリを`shoulders_of_giants`にコピー

### 3. 移行後の確認

移行が完了したら、以下を確認:

1. すべてのエントリが正しく移行されているか
2. `contentful-to-markdown.js`が新しいコンテンツタイプIDを使用しているか
3. ローカルのMarkdownファイルを再生成

### 4. 古いコンテンツタイプの削除（オプション）

移行が完了し、すべてが正常に動作することを確認したら、Contentful Web Appから古いコンテンツタイプを削除できます:

- `diary`（Columnコンテンツ用）→ 削除
- `tweet`（Diaryコンテンツ用）→ 削除
- `shouldersOfGiants` → 削除

**注意**: 削除する前に、すべてのエントリが新しいコンテンツタイプに移行されていることを確認してください。

