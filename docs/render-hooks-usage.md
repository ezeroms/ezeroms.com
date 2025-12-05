# Render Hooks 使用方法

## 概要

Render Hooksを使用すると、Markdownファイル内で特別なリンク構文を使用して、SpotifyやYouTubeの埋め込みを生成できます。

## 使用方法

### Spotify

**基本構文:**
```markdown
[リンクテキスト](spotify:タイプ/ID)
```

**例:**
```markdown
[Spotify Track](spotify:track/3ovwLoowye9dVmbfhz1nEV)
[Spotify Album](spotify:album/4uLU6hMCjMI75M1A2tKUQC)
[Spotify Playlist](spotify:playlist/37i9dQZF1DXcBWIGoYBM5M)
[Spotify Podcast](spotify:podcast/09rBYoieFXHcELiibVmsk6)
[Spotify Episode](spotify:episode/4P1etOegDQ2TRJE7KD0EFP)
```

**対応するタイプ:**
- `track` - トラック（高さ: 380px）
- `album` - アルバム（高さ: 380px）
- `playlist` - プレイリスト（高さ: 380px）
- `podcast` - ポッドキャスト（高さ: 232px）
- `episode` - エピソード（高さ: 232px）

### YouTube

**基本構文:**
```markdown
[リンクテキスト](youtube:動画ID)
```

**例:**
```markdown
[YouTube Video](youtube:oOkUwdoHdrI)
```

**動画IDの取得方法:**
YouTubeのURLから取得します：
- `https://www.youtube.com/watch?v=oOkUwdoHdrI` → `oOkUwdoHdrI`
- `https://youtu.be/oOkUwdoHdrI` → `oOkUwdoHdrI`

## 動作の仕組み

1. **Markdownファイルに記述:**
   ```markdown
   [Spotify Track](spotify:track/3ovwLoowye9dVmbfhz1nEV)
   ```

2. **Hugoがビルド時に処理:**
   - `layouts/_default/_markup/render-link.html`が呼び出される
   - `spotify:`で始まるリンクを検出
   - iframeタグを生成

3. **HTMLが生成される:**
   ```html
   <iframe src="https://open.spotify.com/embed/track/3ovwLoowye9dVmbfhz1nEV" 
           width="100%" 
           height="380" 
           frameborder="0" 
           allowtransparency="true" 
           allow="encrypted-media" 
           class="spotify">
   </iframe>
   ```

## 注意事項

- リンクテキスト（`[`と`]`の間）は表示されませんが、記述は推奨されます（可読性のため）
- 通常のリンク（`spotify:`や`youtube:`で始まらない）は通常通り動作します
- Shortcodeディレクトリは不要です（これが重要なポイント）

## 既存のShortcodeからの移行

**移行前（Shortcode）:**
```markdown
{{< spotify type="track" id="3ovwLoowye9dVmbfhz1nEV" >}}
```

**移行後（Render Hooks）:**
```markdown
[Spotify Track](spotify:track/3ovwLoowye9dVmbfhz1nEV)
```

**移行前（Shortcode）:**
```markdown
{{< youtube id="oOkUwdoHdrI" >}}
```

**移行後（Render Hooks）:**
```markdown
[YouTube Video](youtube:oOkUwdoHdrI)
```
