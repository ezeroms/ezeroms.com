import { marked } from "marked";

/**
 * Contentful → Markdown 移行で過剰エスケープされた記法を戻す。
 * 例: \!\[\](url) → ![](url) / \## 見出し → ## 見出し / \`\`\` → ```
 */
export function unescapeOverEscapedMarkdown(md: string): string {
  if (!md) return md;

  let s = md.replace(/\r\n?/g, "\n");

  // 引用の折り返しが "\\ >" / "\ >" になっているケース
  s = s.replace(/\\\\\s*>/g, "\n>");
  s = s.replace(/\\ >/g, "\n>");

  // Markdown 特殊文字のバックスラッシュ解除
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!|>])/g, "$1");

  return s;
}

/**
 * 1行に潰れたフェンス・リスト・空見出しを、RTE / marked 向けに整える。
 */
export function normalizeLegacyMarkdown(md: string): string {
  if (!md) return md;

  let s = md.replace(/\r\n?/g, "\n");

  // ``` … ```（同一行／改行またぎ）を複数行フェンスに正規化
  s = s.replace(/```([\s\S]*?)```/g, (_m, inner: string) => {
    const body = String(inner).replace(/^\s+|\s+$/g, "");
    return `\n\`\`\`\n${body}\n\`\`\`\n`;
  });

  // 同一行に並んだ "* a * b" を箇条書きに分割
  s = s.replace(/(^|\n)(\*[ \t]+[^\n]+)/g, (chunk) =>
    chunk.replace(/ \* /g, "\n* "),
  );

  // Contentful 由来の空見出し（区切り用）を除去
  s = s.replace(/^#{1,6}\s*$/gm, "");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim() + (md.endsWith("\n") ? "\n" : "");
}

/** 移行用: 過剰エスケープ解除 → 正規化 → HTML */
export function legacyMarkdownToHtml(md: string): string {
  const normalized = normalizeLegacyMarkdown(unescapeOverEscapedMarkdown(md));
  return marked.parse(normalized, { async: false }) as string;
}

function decodeBasicHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** body_html に生 Markdown が残っているか（移行失敗の検出） */
export function looksLikeLiteralMarkdownInHtml(html: string): boolean {
  if (!html) return false;
  return (
    html.includes("```") ||
    /!\[/.test(html) ||
    /<p>\s*#{1,6}\s+\S/.test(html) ||
    /<p>\s*&gt;\s/.test(html) ||
    /<p>\s*>\s/.test(html) ||
    /\]\(<a\b/i.test(html) ||
    /<p>\s*[*_-]\s+/.test(html)
  );
}

/**
 * `<p>![](...)</p>` や `<p>## 見出し</p>` など、HTML 内に残った生 Markdown を
 * いったんテキストに戻してから正しく HTML 化し直す。
 */
export function repairLiteralMarkdownInHtml(html: string): string {
  if (!looksLikeLiteralMarkdownInHtml(html)) return html;

  let text = html.replace(/\r\n?/g, "\n");

  // [label](<a href="url">…</a>) → [label](url)
  text = text.replace(
    /\[([^\]]*)\]\(\s*<a\b[^>]*\bhref=(["'])([^"']+)\2[^>]*>[\s\S]*?<\/a>\s*\)/gi,
    (_m, label: string, _q: string, href: string) => `[${label}](${href})`,
  );

  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/div>\s*<div[^>]*>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h([1-6])[^>]*>/gi, (_m, level: string) => `${"#".repeat(Number(level))} `)
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "* ")
    .replace(/<\/?(ul|ol|blockquote|pre|code|strong|em|b|i|span)[^>]*>/gi, "")
    .replace(/<a\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>([\s\S]*?)<\/a>/gi, "[$3]($2)")
    .replace(/<img\b[^>]*\bsrc=(["'])([^"']+)\1[^>]*(?:\s+alt=(["'])([^"']*)\3)?[^>]*\/?>/gi,
      (_m, _q, src: string, _aq?: string, alt?: string) =>
        `![${alt ?? ""}](${src})`,
    )
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n");

  text = decodeBasicHtmlEntities(text);
  return legacyMarkdownToHtml(text);
}
