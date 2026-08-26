/**
 * セクション／ギャラリーのページ設定行（label / description / status / og_image）を
 * DB のゆるい型から読む共通処理。
 */

/** 文字列として読める値があれば trim して返す。空や未設定なら fallback。 */
export function textFromRow(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function statusFromRow<T extends string>(
  value: unknown,
  fallback: T,
  isAllowed: (value: string) => value is T,
): T {
  if (typeof value === "string" && isAllowed(value)) return value;
  return fallback;
}

export function fieldFromRow(row: object, key: string): unknown {
  if (!(key in row)) return undefined;
  return (row as Record<string, unknown>)[key];
}
