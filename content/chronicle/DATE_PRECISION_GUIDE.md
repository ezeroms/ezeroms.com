# 日付の精度（date_precision）の使い方

Chronicleページでは、記事の日付の表示精度を制御できます。`date_precision`パラメータを使用して、年のみ、年月のみ、年月日のいずれかを指定できます。

## 使い方

Markdownファイルのfront matter（ファイルの先頭の`---`で囲まれた部分）に`date_precision`パラメータを追加します。

### 1. 年のみを表示する場合

```yaml
---
title: "1995年の出来事"
date: 1995-01-01
date_precision: "year"
category: "社会"
subcategory: "その他"
---
```

**表示結果**: `1995`

**使用例**: 
- 年単位でしか特定できない出来事
- 「1995年に起きた出来事」のように年のみが重要な場合

### 2. 年月のみを表示する場合

```yaml
---
title: "1995年6月の出来事"
date: 1995-06-01
date_precision: "month"
category: "社会"
subcategory: "その他"
---
```

**表示結果**: `1995/06`

**使用例**:
- 月単位でしか特定できない出来事
- 「1995年6月に起きた出来事」のように月までが重要な場合

### 3. 年月日を表示する場合（デフォルト）

```yaml
---
title: "1995年1月17日の出来事"
date: 1995-01-17
date_precision: "day"
category: "社会"
subcategory: "災害"
---
```

または、`date_precision`を省略することもできます（デフォルトで`day`として扱われます）：

```yaml
---
title: "1995年1月17日の出来事"
date: 1995-01-17
category: "社会"
subcategory: "災害"
---
```

**表示結果**: `1995/01/17`

**使用例**:
- 日付まで特定できる出来事
- 正確な日付が重要な場合

## 注意事項

1. **`date`フィールドは必須**: `date_precision`を指定する場合でも、`date`フィールドは必ず指定してください。Hugoは`date`フィールドを使用して記事をソートします。

2. **`date`フィールドの形式**: `date`フィールドは常に`YYYY-MM-DD`形式で指定してください。`date_precision`が`year`や`month`の場合でも、`date`フィールドには完全な日付を指定します（例: `1995-01-01`、`1995-06-01`）。

3. **年齢計算**: 年齢の計算は、`date`フィールドの日付を使用して行われます。`date_precision`は表示のみに影響し、年齢計算には影響しません。

## 実装の詳細

- `date_precision: "year"` → 表示: `YYYY`
- `date_precision: "month"` → 表示: `YYYY/MM`
- `date_precision: "day"` または未指定 → 表示: `YYYY/MM/DD`

