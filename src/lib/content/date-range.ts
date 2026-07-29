/**
 * 絞り込み用の日付レンジ（YYYY-MM-DD）。
 */

import {
  firstSearchParamValue,
  parseYearList,
  parseYearMonthList,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";

export type DateRangeValue = {
  /** inclusive start YYYY-MM-DD */
  from: string | null;
  /** inclusive end YYYY-MM-DD */
  to: string | null;
};

export function emptyDateRange(): DateRangeValue {
  return { from: null, to: null };
}

export function dateRangeActive(range: DateRangeValue): boolean {
  return Boolean(range.from || range.to);
}

/** `YYYY-MM-DD` のみ受け付ける。 */
export function parseIsoDate(raw: string): string | null {
  const v = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  // Normalize to actual calendar date (reject 2024-02-31 etc.)
  const [y, m, day] = v.split("-").map(Number);
  if (
    d.getFullYear() !== y ||
    d.getMonth() + 1 !== m ||
    d.getDate() !== day
  ) {
    return null;
  }
  return v;
}

export function formatDateLabel(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${y}/${m}/${d}`;
}

export function formatDateRangeSummary(range: DateRangeValue): string | null {
  if (!range.from && !range.to) return null;
  if (range.from && range.to) {
    return `${formatDateLabel(range.from)} – ${formatDateLabel(range.to)}`;
  }
  if (range.from) return `${formatDateLabel(range.from)} –`;
  return `– ${formatDateLabel(range.to!)}`;
}

function lastDayOfMonth(year: number, month1to12: number): string {
  const d = new Date(year, month1to12, 0);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 旧 `m=2024-01,2024-03` をレンジに変換。 */
export function dateRangeFromYearMonths(months: string[]): DateRangeValue {
  if (!months.length) return emptyDateRange();
  const sorted = [...months].sort();
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const [fy, fm] = first.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  return {
    from: `${String(fy).padStart(4, "0")}-${String(fm).padStart(2, "0")}-01`,
    to: lastDayOfMonth(ly, lm),
  };
}

/** 旧 `y=2024,2025` をレンジに変換。 */
export function dateRangeFromYears(years: string[]): DateRangeValue {
  if (!years.length) return emptyDateRange();
  const sorted = [...years].sort();
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  return {
    from: `${first}-01-01`,
    to: `${last}-12-31`,
  };
}

/**
 * URL から日付レンジを読む。
 * `from` / `to` を優先し、なければ旧 `m=`（年月）または `y=`（年）から復元。
 */
export function parseDateRangeFromSearchParams(
  searchParams: SearchParamsRecord,
  options?: { legacyMonthsKey?: string; legacyYearsKey?: string },
): DateRangeValue {
  const from = parseIsoDate(firstSearchParamValue(searchParams, "from"));
  const to = parseIsoDate(firstSearchParamValue(searchParams, "to"));
  if (from || to) {
    if (from && to && from > to) return { from: to, to: from };
    return { from, to };
  }

  const monthsKey = options?.legacyMonthsKey ?? "m";
  const yearsKey = options?.legacyYearsKey ?? "y";
  const months = parseYearMonthList(
    firstSearchParamValue(searchParams, monthsKey),
  );
  if (months.length) return dateRangeFromYearMonths(months);

  const years = parseYearList(firstSearchParamValue(searchParams, yearsKey));
  if (years.length) return dateRangeFromYears(years);

  return emptyDateRange();
}

export function appendDateRangeToQuery(
  query: URLSearchParams,
  range: DateRangeValue,
): void {
  if (range.from) query.set("from", range.from);
  if (range.to) query.set("to", range.to);
}

/** ISO datetime / date がレンジ内か（日付部分のみ比較）。 */
export function isoDateInRange(
  iso: string | null | undefined,
  range: DateRangeValue,
): boolean {
  if (!dateRangeActive(range)) return true;
  if (!iso) return false;
  const day = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function startOfMonthIso(year: number, month0: number): string {
  const mm = String(month0 + 1).padStart(2, "0");
  return `${year}-${mm}-01`;
}

export function addMonths(year: number, month0: number, delta: number): {
  year: number;
  month0: number;
} {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}
