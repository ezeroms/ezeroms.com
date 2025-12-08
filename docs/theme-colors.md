# テーマファイルの色管理一覧

## 概要
`static/css/common/theme.css`で定義されているCSS変数を使用して、サイト全体の色を一元管理しています。

## カラーパレット

### メインカラー
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-primary` | `#050317` | メインカラー（ダークブルー/ブラック） | ボタン背景、リンク、アクティブ状態 |
| `--color-primary-hover` | `#39393D` | ホバー時のメインカラー | ボタンホバー、リンクホバー |
| `--color-primary-active` | `#5D5D5F` | アクティブ時のメインカラー | ボタンクリック時 |

### セカンダリカラー
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-secondary` | `#7a7a7a` | セカンダリテキスト | 補足情報、日付、メタ情報 |
| `--color-secondary-light` | `rgba(0, 0, 0, 0.7)` | 薄いセカンダリ（70%不透明度） | サイドバーボタン、ツールチップ |
| `--color-secondary-lighter` | `rgba(0, 0, 0, 0.65)` | より薄いセカンダリ（65%不透明度） | サイドバーナビゲーションリンク |
| `--color-secondary-lightest` | `rgba(0, 0, 0, 0.4)` | 最も薄いセカンダリ（40%不透明度） | セクション見出し、ラベル |

### 背景色
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-background` | `#f9f9f7` | メイン背景色（ベージュ/オフホワイト） | ページ背景、コンテナ背景 |
| `--color-background-white` | `#ffffff` | 白背景 | カード背景、サイドバー背景、ヘッダー背景 |
| `--color-background-hover` | `rgba(0, 0, 0, 0.03)` | ホバー時の背景（3%不透明度） | リンクホバー、ボタンホバー |
| `--color-background-active` | `rgba(0, 0, 0, 0.05)` | アクティブ時の背景（5%不透明度） | アクティブなナビゲーション項目 |

### ボーダー色
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-border` | `#E7E7E9` | 標準ボーダー色（ライトグレー） | カードボーダー、入力フィールドボーダー |
| `--color-border-hover` | `#6E6D79` | ホバー時のボーダー色（ミディアムグレー） | ホバー時のカードボーダー、アクティブなボーダー |
| `--color-border-light` | `#D0D0D1` | 薄いボーダー色（ライトグレー） | ソーシャルアクションボタンのホバー |

### アクセントカラー
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-accent-green` | `#06C655` | アクセントグリーン | LINE共有ボタンのホバー、成功メッセージ |
| `--color-accent-green-light` | `#C8EBCF` | 薄いアクセントグリーン | LINE共有ボタンのホバー時のボーダー |
| `--color-selection` | `#FCEDC3` | テキスト選択時の背景色（ベージュ） | テキスト選択時のハイライト |

### コード関連の色
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-code-background` | `#f4f4f4` | コードブロックの背景色（ライトグレー） | インラインコードの背景 |
| `--color-code-text` | `#C01443` | コードテキストの色（ダークピンク/レッド） | インラインコードのテキスト |

### テキストカラー
| 変数名 | 色コード | 役割 | 使用例 |
|--------|---------|------|--------|
| `--color-text-primary` | `#050317` | メインテキスト色（ダークブルー/ブラック） | 見出し、本文、主要なテキスト |
| `--color-text-secondary` | `#5D5D5F` | セカンダリテキスト色（ミディアムグレー） | 補足情報、説明文、引用文 |
| `--color-text-tertiary` | `#7a7a7a` | 第三階層のテキスト色（グレー） | 日付、メタ情報、TOCリンク |
| `--color-text-dark` | `#111` | ダークテキスト色（ほぼ黒） | 強調テキスト、セカンダリーナビゲーションのホバー |
| `--color-text-inverse` | `#ffffff` | 反転テキスト色（白） | ダーク背景上のテキスト、ボタンテキスト |

## 色の階層構造

### プライマリカラー系
```
--color-primary (#050317)
  ├── --color-primary-hover (#39393D)
  └── --color-primary-active (#5D5D5F)
```

### テキストカラー系
```
--color-text-primary (#050317)
  ├── --color-text-secondary (#5D5D5F)
  ├── --color-text-tertiary (#7a7a7a)
  ├── --color-text-dark (#111)
  └── --color-text-inverse (#ffffff)
```

### 背景色系
```
--color-background (#f9f9f7)
  ├── --color-background-white (#ffffff)
  ├── --color-background-hover (rgba(0, 0, 0, 0.03))
  └── --color-background-active (rgba(0, 0, 0, 0.05))
```

### ボーダー色系
```
--color-border (#E7E7E9)
  ├── --color-border-hover (#6E6D79)
  └── --color-border-light (#D0D0D1)
```

## 使用パターン

### カード/コンテナ
- 背景: `--color-background-white`
- ボーダー: `--color-border`
- ホバー時ボーダー: `--color-border-hover`

### ボタン
- 通常: `--color-primary` (背景), `--color-text-inverse` (テキスト)
- ホバー: `--color-primary-hover` (背景)
- アクティブ: `--color-primary-active` (背景)

### リンク/ナビゲーション
- 通常: `--color-text-primary`
- ホバー: `--color-background-hover` (背景)
- アクティブ: `--color-background-active` (背景), `--color-text-primary` (テキスト)

### タグ
- 通常: `--color-background` (背景), `--color-border` (ボーダー), `--color-text-primary` (テキスト)
- ホバー: `--color-border` (背景), `--color-border-hover` (ボーダー)
- アクティブ: `--color-primary` (背景), `--color-text-inverse` (テキスト)

## 注意事項

1. **ハードコードされた色**: 一部のCSSファイルにはまだハードコードされた色が残っています（例: `#F8F7F4`, `#EFEDE6`など）。これらは将来的に変数化することを推奨します。

2. **不透明度の使用**: セカンダリカラーと背景色では、`rgba()`を使用して不透明度を調整しています。これにより、背景色に応じた柔軟な色調整が可能です。

3. **色の一貫性**: テーマファイルの変数を変更することで、サイト全体の色を一括で更新できます。




