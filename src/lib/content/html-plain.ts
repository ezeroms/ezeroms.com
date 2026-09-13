/** HTML / Markdown 本文からプレーンテキストや画像 URL を取り出す共通処理。 */

/** Markdown 画像 `![alt](url "title")` */
const MARKDOWN_IMAGE_RE =
  /!\[[^\]]*]\(\s*<?[^)\s>]+>?\s*(?:["'][^"']*["'])?\s*\)/g;

/**
 * 抜粋用に写真を落とす。figure / img / Markdown 画像は本文に出さない。
 */
export function stripMediaBlocks(html: string): string {
  return html
    .replace(/<figure\b[\s\S]*?<\/figure>/gi, " ")
    .replace(/<p>\s*<img\b[^>]*>\s*<\/p>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(MARKDOWN_IMAGE_RE, " ");
}

/** Strip HTML for OGP / titles / excerpts */
export function htmlToPlainText(html: string): string {
  return stripMediaBlocks(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<figcaption\b[\s\S]*?<\/figcaption>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 本文中の最初の画像 URL。
 * 移行データは `<img>` ではなく Markdown の `![](...)` のまま残っていることがある。
 */
export function firstImageSrc(html: string): string | null {
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img?.[1]) return img[1].trim();

  const markdown = html.match(
    /!\[[^\]]*]\(\s*<?([^)\s>]+)>?\s*(?:["'][^"']*["'])?\s*\)/,
  );
  if (markdown?.[1]) return markdown[1].trim();

  return null;
}
