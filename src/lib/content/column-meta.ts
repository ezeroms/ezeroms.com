import { notesExcerpt } from "@/lib/content/notes-meta";
import { firstImageSrc, htmlToPlainText } from "@/lib/content/html-plain";
import { COLUMN_THUMBS } from "@/lib/content/column-thumbs.generated";

export function columnExcerpt(html: string, max = 120): string {
  return notesExcerpt(html, max);
}

export function columnThumbSrc(
  html: string,
  ogImage?: string | null,
  slug?: string | null,
): string | null {
  const og = (ogImage ?? "").trim();
  if (og) return og;
  if (slug && COLUMN_THUMBS[slug]) return COLUMN_THUMBS[slug];
  return firstImageSrc(html);
}

export function formatColumnDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export { htmlToPlainText, firstImageSrc };
