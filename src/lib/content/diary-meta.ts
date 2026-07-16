import type { Diary } from "@/types/content";

/** Normalize diary_month / date → `YYYY-MM` */
export function diaryMonthKey(item: Pick<Diary, "date" | "diary_month">): string {
  for (const m of item.diary_month ?? []) {
    const slash = m.match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
    if (slash) return `${slash[1]}-${slash[2].padStart(2, "0")}`;
    if (/^\d{4}-\d{2}/.test(m)) return m.slice(0, 7);
  }
  const d = new Date(item.date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function diaryPermalink(slug: string): string {
  return `/diary/${slug}/`;
}

/** Strip HTML for OGP / titles */
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

export function diaryExcerpt(html: string, max = 140): string {
  const text = htmlToPlainText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function diaryTitle(item: Pick<Diary, "date" | "body_html">): string {
  const d = new Date(item.date);
  const dateLabel = Number.isNaN(d.getTime())
    ? "Notes"
    : d.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const excerpt = diaryExcerpt(item.body_html, 48);
  return excerpt ? `${dateLabel} — ${excerpt}` : dateLabel;
}

/** First <img src> in body, if any */
export function firstImageSrc(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

export function absoluteUrl(pathOrUrl: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = siteUrl.replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}
