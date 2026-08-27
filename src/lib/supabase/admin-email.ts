/** Comma-separated allowlist. When set, only these emails may use admin APIs/pages. */
export function isAdminEmail(email: string | null | undefined): boolean {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return true;
  if (!email) return false;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  // 値が書いてあるのにメールが1件も取れない（`ADMIN_EMAILS=,` など）は全員許可にしない。
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}
