import {
  appendDateRangeToQuery,
  dateRangeActive,
  emptyDateRange,
  formatDateRangeSummary,
  isoDateInRange,
  parseDateRangeFromSearchParams,
  type DateRangeValue,
} from "@/lib/content/date-range";
import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  parseWeekdayList,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";
import type { Diary } from "@/types/content";

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
  from: string | null;
  to: string | null;
  weekdays: number[];
  tags: string[];
  places: string[];
};

export function emptyNotesFilter(): NotesFilterState {
  return { ...emptyDateRange(), weekdays: [], tags: [], places: [] };
}

export function notesFilterActive(filter: NotesFilterState): boolean {
  return (
    dateRangeActive(filter) ||
    filter.weekdays.length > 0 ||
    filter.tags.length > 0 ||
    filter.places.length > 0
  );
}

/** Parse `/diary/?from=&to=&w=&t=&p=`（旧 `m=` 年月も可） */
export function parseNotesFilter(
  searchParams: SearchParamsRecord,
): NotesFilterState {
  const range = parseDateRangeFromSearchParams(searchParams, {
    legacyMonthsKey: "m",
  });
  return {
    from: range.from,
    to: range.to,
    weekdays: parseWeekdayList(firstSearchParamValue(searchParams, "w")),
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
    places: decodePipeSeparatedList(firstSearchParamValue(searchParams, "p")),
  };
}

export function serializeNotesFilter(filter: NotesFilterState): string {
  const query = new URLSearchParams();
  appendDateRangeToQuery(query, filter);
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

export function diaryMatchesDateRange(
  item: Diary,
  range: DateRangeValue,
): boolean {
  return isoDateInRange(item.date, range);
}

export function diaryMatchesWeekdays(item: Diary, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const day = new Date(item.date).getDay();
  return weekdays.includes(day);
}

/** Match ISO date against a range (clips / column / generic). */
export function dateMatchesRange(
  iso: string,
  range: DateRangeValue,
): boolean {
  return isoDateInRange(iso, range);
}

export function dateMatchesWeekdays(iso: string, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const day = new Date(iso).getDay();
  return weekdays.includes(day);
}

export { formatDateRangeSummary };
