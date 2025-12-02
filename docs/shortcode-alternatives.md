# Shortcode代替手段の提案

## 問題の確認

調査の結果、**`layouts/shortcodes/`ディレクトリの存在自体が問題の原因**であることが確認されました。個別のshortcodeファイル（spotify.html、youtube.html）の内容ではなく、ディレクトリの存在がHugoのテンプレート解決ロジックに影響を与えています。

## 代替手段

### 解決策1: Markdown内で直接HTMLを記述（推奨）

Markdownは生のHTMLを許可しているため、iframeを直接記述できます。

#### 使用方法

**Spotify:**
```markdown
<iframe src="https://open.spotify.com/embed/track/3ovwLoowye9dVmbfhz1nEV" 
        width="100%" 
        height="152" 
        frameborder="0" 
        allowtransparency="true" 
        allow="encrypted-media" 
        class="spotify">
</iframe>
```

**YouTube:**
```markdown
<iframe src="https://www.youtube.com/embed/oOkUwdoHdrI" 
        width="100%" 
        height="315" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen 
        class="youtube">
</iframe>
```

#### メリット
- ✅ Shortcodeディレクトリが不要
- ✅ Tweet list.htmlが正常に動作
- ✅ シンプルで直接的な方法
- ✅ 追加の設定不要

#### デメリット
- ⚠️ HTMLを直接記述する必要がある
- ⚠️ パラメータの管理が手動

### 解決策2: Render Hooksを使用

HugoのRender Hooks機能を使用して、特別なリンク構文をiframeに変換します。

#### 実装方法

`layouts/_default/_markup/render-link.html`を作成：

```html
{{- if strings.HasPrefix .Destination "spotify:" -}}
  {{- $parts := split (strings.TrimPrefix "spotify:" .Destination) "/" -}}
  {{- $type := index $parts 0 | default "track" -}}
  {{- $id := index $parts 1 -}}
  <iframe src="https://open.spotify.com/embed/{{ $type }}/{{ $id }}" 
          width="100%" 
          height="152" 
          frameborder="0" 
          allowtransparency="true" 
          allow="encrypted-media" 
          class="spotify">
  </iframe>
{{- else if strings.HasPrefix .Destination "youtube:" -}}
  {{- $id := strings.TrimPrefix "youtube:" .Destination -}}
  <iframe src="https://www.youtube.com/embed/{{ $id }}" 
          width="100%" 
          height="315" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen 
          class="youtube">
  </iframe>
{{- else -}}
  <a href="{{ .Destination }}"{{ with .Title}} title="{{ . }}"{{ end }}>{{ .Text | safeHTML }}</a>
{{- end -}}
```

#### 使用方法

**Spotify:**
```markdown
[Spotify Track](spotify:track/3ovwLoowye9dVmbfhz1nEV)
```

**YouTube:**
```markdown
[YouTube Video](youtube:oOkUwdoHdrI)
```

#### メリット
- ✅ Markdown構文で記述可能
- ✅ Shortcodeディレクトリが不要
- ✅ Tweet list.htmlが正常に動作（確認済み）

#### デメリット
- ⚠️ 通常のリンク処理に影響する可能性
- ⚠️ 実装がやや複雑

### 解決策3: JavaScriptによる動的埋め込み

フロントエンドでJavaScriptを使用して、特別なマーカーをiframeに変換します。

#### 実装方法

1. Markdown内で特別なコメントやdivを使用：
```markdown
<!-- spotify:track:3ovwLoowye9dVmbfhz1nEV -->
<!-- youtube:oOkUwdoHdrI -->
```

2. JavaScriptで処理：
```javascript
document.querySelectorAll('comment').forEach(comment => {
  if (comment.textContent.startsWith('spotify:')) {
    // iframeを生成して挿入
  }
});
```

#### メリット
- ✅ ビルド時に影響しない
- ✅ 柔軟な実装が可能

#### デメリット
- ⚠️ JavaScriptが必要
- ⚠️ SEOに影響する可能性
- ⚠️ 実装が複雑

## 推奨される解決策

### 即座の対応: 解決策1（直接HTML記述）

最もシンプルで確実な方法です。既存のshortcode使用箇所を以下のように置き換えます：

**置き換え前:**
```markdown
{{< spotify type="track" id="3ovwLoowye9dVmbfhz1nEV" >}}
```

**置き換え後:**
```markdown
<iframe src="https://open.spotify.com/embed/track/3ovwLoowye9dVmbfhz1nEV" 
        width="100%" 
        height="152" 
        frameborder="0" 
        allowtransparency="true" 
        allow="encrypted-media" 
        class="spotify">
</iframe>
```

### 長期的な対応: 解決策2（Render Hooks）

よりMarkdownらしい記述を維持したい場合は、Render Hooksを使用します。

## 移行手順

1. **Shortcodeディレクトリを除外**（既に実施済み）
2. **Shortcode使用箇所を特定**
   ```bash
   grep -r "{{<.*spotify\|{{<.*youtube" content/
   ```
3. **各ファイルを修正**
   - 解決策1: HTMLに直接置き換え
   - 解決策2: Render Hooks構文に変更
4. **ビルドして確認**
   ```bash
   hugo --quiet
   ```
5. **Tweet list.htmlが正常に動作することを確認**

## 注意事項

- Shortcodeを使用しているコンテンツファイルをすべて修正する必要があります
- 修正後は、shortcodeディレクトリを復元しないでください
- 新しい埋め込みが必要な場合は、直接HTMLを記述するか、Render Hooksを使用してください

## 参考

- [Hugo Render Hooks Documentation](https://gohugo.io/templates/render-hooks/)
- [Markdown HTML Support](https://daringfireball.net/projects/markdown/syntax#html)

