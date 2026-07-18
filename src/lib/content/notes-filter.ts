import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  parseWeekdayList,
  parseYearMonthList,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";
import type { Diary } from "@/types/content";
import { diaryMonthKey } from "@/lib/content/diary-meta";

export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type NotesFilterState = {
  months: string[];
  weekdays: number[];
  tags: string[];
  places: string[];
};

export function emptyNotesFilter(): NotesFilterState {
  return { months: [], weekdays: [], tags: [], places: [] };
}

export function notesFilterActive(filter: NotesFilterState): boolean {
  return (
    filter.months.length > 0 ||
    filter.weekdays.length > 0 ||
    filter.tags.length > 0 ||
    filter.places.length > 0
  );
}

/** Parse `/diary/?m=&w=&t=&p=` */
export function parseNotesFilter(
  searchParams: SearchParamsRecord,
): NotesFilterState {
  return {
    months: parseYearMonthList(firstSearchParamValue(searchParams, "m")),
    weekdays: parseWeekdayList(firstSearchParamValue(searchParams, "w")),
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
    places: decodePipeSeparatedList(firstSearchParamValue(searchParams, "p")),
  };
}

export function serializeNotesFilter(filter: NotesFilterState): string {
  const query = new URLSearchParams();
  if (filter.months.length) query.set("m", filter.months.join(","));
  if (filter.weekdays.length) query.set("w", filter.weekdays.join(","));
  if (filter.tags.length) {
    query.set("t", encodePipeSeparatedList(filter.tags));
  }
  if (filter.places.length) {
    query.set("p", encodePipeSeparatedList(filter.places));
  }
  return toQueryString(query);
}

export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  if (!year || !month) return ym;
  const parsed = new Date(`${year}-${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return ym;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function diaryMatchesMonths(item: Diary, months: string[]): boolean {
  if (!months.length) return true;
  const key = diaryMonthKey(item);
  if (months.includes(key)) return true;
  return (item.diary_month ?? []).some((raw) => {
    const slash = raw.match(/^(\d{4})\/(\d{1,2})/);
    if (slash) {
      return months.includes(
        `${slash[1]}-${slash[2].padStart(2, "0")}`,
      );
    }
    return months.includes(raw.slice(0, 7));
  });
}

export function diaryMatchesWeekdays(item: Diary, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const day = new Date(item.date).getDay();
  return weekdays.includes(day);
}

/** Match YYYY-MM against an ISO date string (clips / generic). */
export function dateMatchesMonths(iso: string, months: string[]): boolean {
  if (!months.length) return true;
  const key = iso.slice(0, 7);
  return months.includes(key);
}

export function dateMatchesWeekdays(iso: string, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const day = new Date(iso).getDay();
  return weekdays.includes(day);
}
