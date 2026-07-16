import {
  diaryExcerpt,
  firstImageSrc,
  htmlToPlainText,
} from "@/lib/content/diary-meta";

export function columnExcerpt(html: string, max = 120): string {
  return diaryExcerpt(html, max);
}

export function columnThumbSrc(html: string): string | null {
  return firstImageSrc(html);
}

export function formatColumnDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export { htmlToPlainText };
