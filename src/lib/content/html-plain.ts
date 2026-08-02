/** HTML / Markdown 本文からプレーンテキストや画像 URL を取り出す共通処理。 */

/** Strip HTML for OGP / titles / excerpts */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
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
