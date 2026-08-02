export type ColumnTocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugifyHeading(text: string, used: Map<string, number>): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "section";
  const n = used.get(base) ?? 0;
  used.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
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
 * Collect h2/h3 from article HTML and ensure each has an id for in-page links.
 */
export function prepareColumnToc(html: string): {
  html: string;
  toc: ColumnTocItem[];
} {
  const used = new Map<string, number>();
  const toc: ColumnTocItem[] = [];

  const nextHtml = html.replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (_full, levelStr: string, attrs = "", inner: string) => {
      const level = Number(levelStr) as 2 | 3;
      const text = stripTags(inner);
      if (!text) return _full;

      const existingId = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
      const id = existingId?.trim() || slugifyHeading(text, used);

      toc.push({ id, text, level });

      if (existingId) {
        return `<h${level}${attrs}>${inner}</h${level}>`;
      }
      const cleaned = attrs.replace(/\s*id\s*=\s*["'][^"']*["']/gi, "");
      return `<h${level}${cleaned} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: nextHtml, toc };
}
