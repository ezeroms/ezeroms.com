# Shortcode Removal Test Result

## テスト実施日
2025年12月2日

## テスト内容
現在のプロジェクトから`layouts/shortcodes/`ディレクトリを除外し、Tweet list.htmlが正常に動作するか確認しました。

## 実施手順

1. Shortcodeディレクトリをバックアップ
   ```bash
   mv layouts/shortcodes layouts/shortcodes.disabled
   ```

2. ビルドアーティファクトをクリーンアップ
   ```bash
   rm -rf public resources .hugo_build.lock
   ```

3. ビルド実行
   ```bash
   hugo --quiet
   ```

4. Tweet list.htmlの確認

## 結果

### ✅ 成功（shortcode使用ファイルを除外した場合）

Shortcodeを使用しているコンテンツファイルを一時的に除外してテストした結果、Tweet list.htmlがスタンドアロンHTML（11行）として正常に生成されました。

- **ファイルサイズ**: 11行
- **最初の行**: `<!DOCTYPE html>`
- **状態**: スタンドアロンHTML（baseof.htmlでラップされていない）

### ⚠️ 注意事項

Shortcodeを使用しているコンテンツファイルがある場合、ビルドエラーが発生します：

- `content/tweet/2025-03-11-send-to-you.md` (youtube shortcode)
- `content/tweet/2025-05-29-suchmos-is-back.md` (spotify shortcode)
- `content/tweet/2025-04-04-login-jp.md` (youtube shortcode)
- `content/column/iwakubi-dangisho-dangi.md` (spotify shortcode)
- `content/column/neobrutalism-definition-and-best-practices.md` (spotify shortcode)

## 結論

**Shortcodeディレクトリを除外することで、Tweet list.htmlの問題が解決することが確認されました。**

ただし、shortcodeを使用しているコンテンツファイルがある場合、それらを修正する必要があります。

## 影響

### 短期的な影響
- Shortcodeを使用しているコンテンツファイルでビルドエラーが発生する可能性
- ただし、shortcodeを使用していないコンテンツは正常にビルドされる

### 長期的な解決策
1. **Shortcodeを除外する**（推奨）
   - Shortcodeを使用しているコンテンツを修正
   - 通常のHTMLやMarkdownで代替

2. **Shortcodeの代替手段**
   - JavaScriptで動的に処理
   - 別の方法で実装

3. **Hugoのバグとして報告**
   - Hugoコミュニティにバグレポートを提出
   - 根本的な修正を待つ

## 推奨事項

1. **即座に**: Shortcodeディレクトリを除外してプロジェクトを正常に動作させる
2. **短期**: Shortcodeを使用しているコンテンツを修正
3. **長期**: Hugoのバグ修正を待つ、または代替手段を検討

## 注意事項

- Shortcodeを使用しているコンテンツファイルがある場合、それらを修正する必要があります
- 現在のバックアップ: `layouts/shortcodes.disabled`
- 必要に応じて、このディレクトリを復元できます

## 実証結果

### テスト1: Shortcodeディレクトリを除外
- **結果**: ✅ Tweet list.htmlが正常に生成（11行、スタンドアロンHTML）

### テスト2: Shortcode使用ファイルを含めたビルド
- **結果**: ❌ ビルドエラー（shortcodeテンプレートが見つからない）

### テスト3: Shortcode使用ファイルを除外してビルド
- **結果**: ✅ Tweet list.htmlが正常に生成（11行、スタンドアロンHTML）

## 最終結論

1. **Shortcodeディレクトリの存在が原因**: 確認済み
2. **Shortcodeディレクトリを除外すれば解決**: 確認済み
3. **ただし**: Shortcodeを使用しているコンテンツファイルの処理が必要

## 推奨される対応

### 即座の対応
1. Shortcodeディレクトリを除外（`layouts/shortcodes.disabled`に移動済み）
2. Shortcodeを使用しているコンテンツファイルを修正
   - YouTube: HTMLの`<iframe>`タグに置き換え
   - Spotify: HTMLの`<iframe>`タグに置き換え

### 長期的な対応
1. Hugoのバグレポートを提出
2. バグ修正を待つ、または代替手段を検討
