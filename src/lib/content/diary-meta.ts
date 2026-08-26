/**
 * Diary（公開 URL / DB テーブルは diary）向けの表示・メタ用ヘルパー。
 */
import type { Diary } from "@/types/content";
import { htmlToPlainText } from "@/lib/content/html-plain";

/**
 * diary_month または投稿日からの月キー（`YYYY-MM`）。
 * フィルタ・「続きを読む」の月指定で使う。
 */
export function diaryMonthKey(
  item: Pick<Diary, "date" | "diary_month">,
): string {
  for (const month of item.diary_month ?? []) {
    const slash = month.match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
    if (slash) {
      return `${slash[1]}-${slash[2].padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}/.test(month)) {
      return month.slice(0, 7);
    }
  }
  const parsed = new Date(item.date);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** 公開パーマリンク。 */
export function diaryPermalink(slug: string): string {
  return `/diary/${slug}/`;
}

export function diaryExcerpt(html: string, max = 140): string {
  const text = htmlToPlainText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

/** ブラウザタブ・OGP 用タイトル（日付 + 冒頭抜粋）。 */
export function diaryTitle(item: Pick<Diary, "date" | "body_html">): string {
  const parsed = new Date(item.date);
  const dateLabel = Number.isNaN(parsed.getTime())
    ? "Diary"
    : parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  const excerpt = diaryExcerpt(item.body_html, 48);
  return excerpt ? `${dateLabel} — ${excerpt}` : dateLabel;
}

/** パンくず・カード見出し用の日付ラベル */
export function formatDiaryDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** 詳細ページ用の日時（分まで） */
export function formatDiaryDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
