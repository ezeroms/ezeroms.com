/** 管理テーブル用のステータス表示 */
export function adminStatusLabel(status: string): string {
  if (status === "published") return "公開";
  if (status === "draft") return "非公開";
  if (status === "archived") return "アーカイブ";
  if (status === "private") return "非公開";
  return status;
}

export function formatAdminListDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function excerptFromHtml(html: string, max = 80): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
