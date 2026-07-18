/**
 * 各 *Filter の URL クエリ解析で共通利用するヘルパー。
 * searchParams の取り出し方をファイルごとにコピーしないための置き場。
 */

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

/** Next.js の searchParams から単一の文字列値を取り出す。 */
export function firstSearchParamValue(
  searchParams: SearchParamsRecord,
  key: string,
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * `a|b|c` 形式（各要素は encodeURIComponent 済み想定）を配列に戻す。
 */
export function decodePipeSeparatedList(raw: string): string[] {
  return raw
    .split("|")
    .map((part) => {
      const trimmed = part.trim();
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return trimmed;
      }
    })
    .filter(Boolean);
}

/** `2024,2025` のような年リスト。 */
export function parseYearList(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}$/.test(part));
}

/** `2024-01,2024-02` のような年月リスト。 */
export function parseYearMonthList(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}-\d{2}$/.test(part));
}

/** `0,1,6` のような曜日インデックス（0=日 … 6=土）。 */
export function parseWeekdayList(raw: string): number[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part))
    .map((part) => Number(part))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

/** 配列を `|` 区切りの encode 済みクエリ値にする。 */
export function encodePipeSeparatedList(values: string[]): string {
  return values.map((value) => encodeURIComponent(value)).join("|");
}

/** クエリ文字列を `?…` 形式にする（空なら空文字）。 */
export function toQueryString(params: URLSearchParams): string {
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
