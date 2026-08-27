const FALLBACK = "/admin/workspace/";

/**
 * `/admin` 配下の相対パスだけ通す。
 * `//evil` や `https:` を next に載せない（オープンリダイレクト防止）。
 */
export function safeAdminNextPath(raw: string | null | undefined): string {
  if (!raw) return FALLBACK;
  const next = raw.trim();
  if (next !== "/admin" && next !== "/admin/" && !next.startsWith("/admin/")) {
    return FALLBACK;
  }
  if (
    next.includes("://") ||
    next.includes("\\") ||
    next.includes("..") ||
    next.startsWith("//")
  ) {
    return FALLBACK;
  }
  return next;
}
