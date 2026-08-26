/** トップ画像の撮影年。空や範囲外なら null。 */
export function parseCapturedYear(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isInteger(n) || n < 1900 || n > 2100) return null;
  return n;
}

export function buildTopImageAlt(
  location: string | null,
  year: number | null,
  fallback?: string,
): string {
  if (location && year != null) return `${location}, ${year}`;
  if (location) return location;
  if (year != null) return String(year);
  return (fallback ?? "").trim() || "Random Image";
}
