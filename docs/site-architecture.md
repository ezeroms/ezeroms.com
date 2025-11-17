# ezeroms.com — Site Architecture & Content Model Specification
version: 1.0  
updated: 2025-11

この文書は、ezeroms.com のサイト構造、情報設計（IA）、Contentful コンテンツモデル、およびレイアウト仕様をまとめた技術ドキュメントである。  
今後、Cursor や GitHub Copilot を用いてコードベースを改修していく際の「基準点」として利用する。

---

## 1. サイトの目的
- 個人サイトとして、文章・制作物・写真・文献引用を一元的に管理する。
- 静的サイト（Hugo）により高速性・安定性・シンプルさを確保する。
- 管理画面（Contentful）により編集性の高さも両立させる。

---

## 2. グローバルナビゲーション（左サイドバー）
- ezeroms.com
  - 遷移先: https://ezeroms.com
  - トップページへの導線
  - 「ezeroms.com」のロゴを表示
- About
  - 遷移先: https://ezeroms.com/about
  - コンテンツ: 自己紹介
- Tweet
  - 遷移先: https://ezeroms.com/tweet
  - コンテンツ: 短文・つぶやき
- Diary
  - 遷移先: https://ezeroms.com/diary
  - コンテンツ: 心情・日々の観察
- Column
	- 遷移先: https://ezeroms.com/column
	- コンテンツ: 考察
- Snap
	- 遷移先: https://ezeroms.com/snap
	- コンテンツ: 自分が撮影した写真
- Work
  - 遷移先: https://ezeroms.com/work
  - コンテンツ: 制作物
- The shoulders of Giants
  - 遷移先: https://ezeroms.com/the-shoulders-of-giants
  - コンテンツ: 文献の引用

**ポイント**
- “The shoulders of Giants” は他のカテゴリと性格が異なるため、下段に分離表示する。
- 各メニューを選択すると、右側にメインビューが展開される。

---

## 3. 第二階層ナビゲーション（右側）

### Tweet — 月別アーカイブ
- 2025/11
- 2025/10
- 2025/09
…

- 月をクリック → その月の Tweet 一覧（1ヶ月分をまとめて表示）
- Tweet は個別 URL を持たない

---

### Diary — 月別アーカイブ + 個別記事ページ
2025/11
2025/10
2025/09
…

- 月をクリック → その月のすべての記事一覧（タイトルを本文を1ヶ月分をまとめて表示）
- 各記事には個別 URL がある（例：`/diary/2025-11-04/`）

---

### Column — カテゴリ別
- 音楽
- 漫画・アニメ
- 映画・ドラマ
- お笑い
- ゲーム
- スポーツ
- 本・雑誌
- 政治
- 経済・ビジネス
- 言葉・言語
- 海外文化
- デザイン
- インターネット・技術
- プロダクト開発・サービス運営
- 自然科学
- 人文・社会科学

- カテゴリをクリック → そのカテゴリの記事タイトルと概要文の一覧
- クリックして詳細ページに飛ばす構造
- Column は記事ごとに URL を持つ

---

### Snap — 一覧のみ
- サブナビなし  
- ギャラリー・グリッド表示を想定

---

### Work — 制作物一覧
- サブナビなし  
- 既存構造を踏襲

---

### The shoulders of Giants
- 目的
  - 個人の創作・思考の背景にある「知的参照」をまとめるためのアーカイブ。
  - 引用文・抜粋を保存し、トピック（タグ）で参照できるようにする。
- メニューに並べるのは topic（タグ）一覧 である。
- 例
  - アイデンティティ
  - アニメーション
  - インターネット
  - エンタメ
  - ケア
  - コミュニケーション
	…


---

## 4. Contentful — Content Models

---

### About (1ページのみ)

| Field | Type |
|-------|-------------|
| body | Rich text / Markdown |

---

### Tweet

| Field | Type |
|-------|-------------|
| date | DateTime |
| body | Short text |
| slug | Auto（年月 + 連番想定） |
| tags | List (optional) |

---

### Diary

| Field | Type |
|-------|-------------|
| title | Short text |
| date | DateTime |
| body | Rich text |
| slug | Short text（ランダムID or date） |
| tags | List |

---

### Column

| Field | Type |
|-------|-------------|
| title | Short text |
| body | Rich text |
| category | Single select（必須） |
| tags | List |
| date | DateTime |
| slug | Short text |

---

### Photo

| Field | Type |
|-------|-------------|
| date | Date |
| image | Asset |
| caption | Short text |
| slug | Short text |

---

### Work

| Field | Type |
|-------|-------------|
| title | Short text |
| date | Date |
| image | Asset |
| body | Rich text |
| slug | Short text |

---

### The shoulders of Giants

| Field | Type |
|-------|-------------|
| topic | List (short text) |
| body | Rich text |
| date | (optional) |
| slug | Short text |

---

## 5. URL 設計

### Tweet
/tweet/2025/11/
/tweet/2025/10/

### Diary
/diary/2025/11/            ← 月別一覧
/diary/2025-11-04/         ← 個別

### Column
/column/music/
/column/slug/

### Photo
/photo/
/photo/slug/

### Work
/work/blendystick/

### The shoulders of Giants
/shoulders-of-giants/

---

## 6. レイアウト仕様（UI）

- 左サイドバー：固定  
- メインコンテンツ：中央  
- 第二階層ナビ：右側  
- モバイル：サイドバーを折りたたみ  
- 既存のトップページは維持  
- 既存の Diary URL は壊さない

---

## 7. 今後の改善余地

- Tweet / Diary / Column のタグ体系をどう扱うか  
- Photo：グリッド構成を検討  
- Column カテゴリの階層化  
- Tweet の UI 最適化  
- Contentful → GitHub の同期方法（GitHub Actions）  

---

## 8. ドキュメントの役割

- 開発（自分 + AI）で迷わないための「地図」  
- Cursor に丸ごとプロンプトとして渡せる  
- レイアウト・URL・API の基準点となる

---
