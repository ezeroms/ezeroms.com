import { COLUMN_CATEGORY_NAMES } from "@/components/ColumnHeaderNav";
import {
  dateMatchesMonths,
  dateMatchesWeekdays,
  formatMonthLabel,
} from "@/lib/content/notes-filter";

export type ColumnFilterState = {
  months: string[];
  weekdays: number[];
  categories: string[];
  tags: string[];
};

export function emptyColumnFilter(): ColumnFilterState {
  return { months: [], weekdays: [], categories: [], tags: [] };
}

export function columnFilterActive(f: ColumnFilterState): boolean {
  return (
    f.months.length > 0 ||
    f.weekdays.length > 0 ||
    f.categories.length > 0 ||
    f.tags.length > 0
  );
}

/** Parse `/column/?m=&w=&c=&t=` */
export function parseColumnFilter(
  sp: Record<string, string | string[] | undefined>,
): ColumnFilterState {
  const one = (key: string) => {
    const v = sp[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };
  const months = one("m")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}$/.test(s));
  const weekdays = one("w")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const decodeList = (raw: string) =>
    raw
      .split("|")
      .map((s) => {
        try {
          return decodeURIComponent(s.trim());
        } catch {
          return s.trim();
        }
      })
      .filter(Boolean);
  return {
    months,
    weekdays,
    categories: decodeList(one("c")),
    tags: decodeList(one("t")),
  };
}

export function serializeColumnFilter(f: ColumnFilterState): string {
  const q = new URLSearchParams();
  if (f.months.length) q.set("m", f.months.join(","));
  if (f.weekdays.length) q.set("w", f.weekdays.join(","));
  if (f.categories.length) {
    q.set("c", f.categories.map((c) => encodeURIComponent(c)).join("|"));
  }
  if (f.tags.length) {
    q.set("t", f.tags.map((t) => encodeURIComponent(t)).join("|"));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function categoryLabel(cat: string): string {
  return COLUMN_CATEGORY_NAMES[cat] ?? cat;
}

export { formatMonthLabel, dateMatchesMonths, dateMatchesWeekdays };
