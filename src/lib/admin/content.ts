import { marked } from "marked";
import { preprocessMarkdownMedia } from "@/lib/html";
import {
  looksLikeLiteralMarkdownInHtml,
  normalizeLegacyMarkdown,
  repairLiteralMarkdownInHtml,
  unescapeOverEscapedMarkdown,
} from "@/lib/content/legacy-markdown";
import {
  applyBlankParagraphClass,
  editorHtmlToMarkdown,
} from "@/lib/admin/rich-text";

/** Generate a short URL-safe slug (diary-style). */
export function generateContentSlug(length = 16): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function monthKeyFromDate(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function parseTagList(raw: string): string[] {
  return raw
    .split(/[,、\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function markdownToHtml(md: string): string {
  const prepared = normalizeLegacyMarkdown(unescapeOverEscapedMarkdown(md));
  const html = marked.parse(preprocessMarkdownMedia(prepared), {
    async: false,
  }) as string;
  return applyBlankParagraphClass(html);
}

/** Markdown → HTML without wrapping block `<p>` (for list item bodies). */
export function inlineMarkdownToHtml(md: string): string {
  const html = markdownToHtml(md).trim();
  return html
    .replace(/^<p>/i, "")
    .replace(/<\/p>$/i, "")
    .replace(/<\/p>\s*<p>/gi, "<br /><br />");
}

/**
 * Fallback when body_md is empty (legacy migrated HTML).
 * 生 Markdown が HTML に残っている場合は修復してから Turndown し、
 * 画像・見出しなどが RTE で正しく見えるようにする。
 */
export function htmlToEditableMarkdown(html: string): string {
  if (!html.trim()) return "";

  const source = looksLikeLiteralMarkdownInHtml(html)
    ? repairLiteralMarkdownInHtml(html)
    : html;

  try {
    const md = editorHtmlToMarkdown(source);
    if (md.trim()) return md;
  } catch {
    // fall through to regex strip
  }

  return source
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h1>/gi, "\n\n")
    .replace(/<\/h2>/gi, "\n\n")
    .replace(/<\/h3>/gi, "\n\n")
    .replace(/<h1[^>]*>/gi, "# ")
    .replace(/<h2[^>]*>/gi, "## ")
    .replace(/<h3[^>]*>/gi, "### ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(
      /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*(?:\s+alt=["']([^"']*)["'])?[^>]*\/?>/gi,
      (_m, src: string, alt?: string) => `![${alt ?? ""}](${src})`,
    )
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
