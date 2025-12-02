# Tweet Layout Issue Investigation Report

## 概要

Tweetセクションのlist.htmlが、サイト全体のビルド後にヘッダーとタグリストが空になる問題が繰り返し発生していました。この問題の根本原因を特定するため、段階的な移行と検証を実施しました。

## 調査方法

### 1. 最小再現例の作成

動作する最小限のHugoプロジェクトを作成し、Tweetセクションが正常に動作する状態を確認しました。

- 場所: `/tmp/hugo-minimal-repro`
- 状態: ✅ Tweet list.htmlがスタンドアロンHTML（11行）として正常に動作

### 2. 段階的移行プロセス

元のプロジェクトから要素を段階的に追加し、各ステップでチェックポイントを実行しました。

#### Phase 1: コアセクションレイアウト
- ✅ Diary list.html
- ✅ Column list.html
- ✅ Work list.html
- ✅ 各セクションの_index.md

#### Phase 2: シングルテンプレート
- ✅ Diary single.html
- ✅ Column single.html
- ✅ Work single.html
- ✅ Tweet single.html

#### Phase 3: 必要なパーシャル
- ✅ notification.html
- ✅ secondary-nav.html
- ✅ column-header-nav.html
- ✅ work-header-nav.html
- ✅ date-selector-nav-diary.html
- ✅ date-selector-nav-tweet.html
- ✅ tweet_menu.html

#### Phase 4: タクソノミーテンプレート
- ✅ diary_tag/term.html
- ✅ diary_month/term.html
- ✅ tweet_tag/term.html
- ✅ tweet_month/term.html
- ✅ column_tag/term.html
- ✅ column_category/term.html
- ✅ work_tag/term.html
- ✅ work_category/term.html
- ✅ tweet_place/term.html

#### Phase 5: 残りのパーシャル
- ✅ すべてのパーシャルファイル（27ファイル）

#### Phase 6: _defaultテンプレート
- ✅ taxonomy.diary_tag.html
- ✅ taxonomy.diary_month.html
- ✅ terms.diary_tag.html
- ✅ terms.diary_month.html

#### Phase 7: サンプルコンテンツ
- ✅ Diaryコンテンツ（9ファイル）
- ✅ Tweetコンテンツ（29ファイル）

#### Phase 8: 残りのレイアウト
- ✅ about/list.html
- ✅ chronicle/list.html
- ✅ media-coverage/list.html
- ✅ snap/list.html
- ✅ subject/list.html
- ✅ topic/list.html
- ✅ ui-design-guidebook layouts

#### Phase 9: すべてのコンテンツ
- ✅ すべてのDiaryコンテンツ
- ✅ すべてのTweetコンテンツ
- ✅ すべてのColumnコンテンツ
- ✅ すべてのWorkコンテンツ

#### Phase 10: 設定オプション
- ✅ すべてのタクソノミー
- ✅ すべてのパーマリンク
- ✅ enableDebug, disableAliases
- ✅ params, author, markup設定

## 問題の特定

### 発見された問題

**Phase 11: Shortcodes追加時**

`layouts/shortcodes/`ディレクトリを追加した時点で、Tweet list.htmlがラップされました。

- **問題発生時**: shortcodesディレクトリを追加した直後
- **症状**: Tweet list.htmlが11行から1023行に増加（baseof.htmlでラップされる）
- **再現性**: 100%再現（空のディレクトリでも発生）

### 検証結果

```bash
# 正常な状態（shortcodeなし）
Tweet list.html: 11行（スタンドアロンHTML）

# shortcodeディレクトリ追加後
Tweet list.html: 1023行（baseof.htmlでラップ）
```

### 根本原因

**`layouts/shortcodes/`ディレクトリの存在が、Hugoのテンプレート解決ロジックに影響を与え、Tweet list.htmlがbaseof.htmlでラップされる原因となっています。**

## 移行統計

### 成功した移行
- **レイアウト**: 64ファイル
- **パーシャル**: 27ファイル
- **コンテンツ**: 86+ファイル
- **設定**: すべてのオプション
- **Gitコミット**: 65+コミット

### 問題が発生した要素
- **Shortcodes**: `layouts/shortcodes/`ディレクトリの存在が原因

## 推奨される解決策

### 1. Shortcodeを除外する（推奨）

現在のプロジェクトからshortcodeディレクトリを一時的に除外し、問題が解決するか確認します。

### 2. Shortcodeの代替手段

- Shortcodeを使わずに、通常のHTMLやMarkdownで実装
- 必要に応じて、JavaScriptで動的に処理

### 3. Tweet list.htmlの修正

Tweet list.htmlがshortcodeの存在に関係なく動作するように修正を検討（ただし、根本原因がHugoのテンプレート解決ロジックにある可能性が高い）

## 作業バージョン

- **場所**: `/tmp/hugo-minimal-repro`
- **状態**: ✅ 正常動作（shortcode除外）
- **アーカイブ**: `/tmp/hugo-working-project.tar.gz`

## 次のステップ

1. 現在のプロジェクトからshortcodeを除外してテスト
2. 問題が解決することを確認
3. Shortcodeが必要な場合は、代替手段を検討
4. 必要に応じて、Hugoコミュニティにバグレポートを提出

## 調査日時

- 開始: 2025年12月2日
- 完了: 2025年12月2日
- 調査者: AI Assistant (Auto)

## 関連ファイル

- 最小再現例: `/tmp/hugo-minimal-repro`
- チェックポイントスクリプト: `/tmp/hugo-minimal-repro/CHECKPOINT.sh`
- 移行ログ: `/tmp/hugo-minimal-repro/MIGRATION-LOG.md`
- 最終レポート: `/tmp/hugo-minimal-repro/FINAL-MIGRATION-REPORT.md`
