import { notesExcerpt } from "@/lib/content/notes-meta";
import { firstImageSrc, htmlToPlainText } from "@/lib/content/html-plain";
import { COLUMN_THUMBS } from "@/lib/content/column-thumbs.generated";
import { firstMediaUrl } from "@/lib/content/og-image";

export function columnExcerpt(html: string, max = 120): string {
  return notesExcerpt(html, max);
}

export function columnThumbSrc(
  html: string,
  ogImage?: string | null,
  slug?: string | null,
  /** 記事 og が空のときのカテゴリ一覧 OGP */
  sectionOgImage?: string | null,
): string | null {
  return firstMediaUrl(
    ogImage,
    sectionOgImage,
    slug ? COLUMN_THUMBS[slug] : null,
    firstImageSrc(html),
  );
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
