import type { ShouldersOfGiants } from "@/types/content";

export function giantsPermalink(slug: string): string {
  return `/shoulders-of-giants/${encodeURIComponent(slug)}/`;
}

/** Bibliographic citation under a quote, e.g. 著者『書名』（出版社、年） */
export function formatGiantsCitation(
  item: Pick<
    ShouldersOfGiants,
    | "book_title"
    | "author"
    | "publisher"
    | "published_year"
    | "citation_override"
  >,
): string {
  if (item.citation_override?.trim()) return item.citation_override.trim();

  const title = item.book_title?.trim();
  const author = item.author?.trim();
  const publisher = item.publisher?.trim();
  const year = item.published_year?.trim();

  const book = title ? `『${title}』` : "";
  const head = [author, book].filter(Boolean).join("");
  const pubBits = [publisher, year ? `${year}年` : ""].filter(Boolean);
  const pub = pubBits.length ? `（${pubBits.join("、")}）` : "";
  return `${head}${pub}`.trim();
}

export function giantsExcerpt(html: string, max = 160): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function decodeQuoteText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    );
}

/** 引用の全文。段落の区切りと、段落内の改行は残す。 */
export function giantsQuoteParagraphs(html: string): string[] {
  const text = decodeQuoteText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|blockquote|li|h[1-6])>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  );
  return text
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/[ \t]*\n[ \t]*/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean);
}
