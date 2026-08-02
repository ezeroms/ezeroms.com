/** Comma-separated allowlist. When set, only these emails may use admin APIs/pages. */
export function isAdminEmail(email: string | null | undefined): boolean {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return true;
  if (!email) return false;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(email.toLowerCase());
}
