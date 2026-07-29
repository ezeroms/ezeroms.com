import { COLUMN_CATEGORY_NAMES } from "@/components/ColumnHeaderNav";
import {
  appendDateRangeToQuery,
  dateRangeActive,
  emptyDateRange,
  formatDateRangeSummary,
  parseDateRangeFromSearchParams,
} from "@/lib/content/date-range";
import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  parseWeekdayList,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";
import {
  dateMatchesRange,
  dateMatchesWeekdays,
} from "@/lib/content/notes-filter";

export type ColumnFilterState = {
  from: string | null;
  to: string | null;
  weekdays: number[];
  categories: string[];
  tags: string[];
};

export function emptyColumnFilter(): ColumnFilterState {
  return { ...emptyDateRange(), weekdays: [], categories: [], tags: [] };
}

export function columnFilterActive(filter: ColumnFilterState): boolean {
  return (
    dateRangeActive(filter) ||
    filter.weekdays.length > 0 ||
    filter.categories.length > 0 ||
    filter.tags.length > 0
  );
}

/** Parse `/column/?from=&to=&w=&c=&t=`（旧 `m=` も可） */
export function parseColumnFilter(
  searchParams: SearchParamsRecord,
): ColumnFilterState {
  const range = parseDateRangeFromSearchParams(searchParams, {
    legacyMonthsKey: "m",
  });
  return {
    from: range.from,
    to: range.to,
    weekdays: parseWeekdayList(firstSearchParamValue(searchParams, "w")),
    categories: decodePipeSeparatedList(
      firstSearchParamValue(searchParams, "c"),
    ),
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
  };
}

export function serializeColumnFilter(filter: ColumnFilterState): string {
  const query = new URLSearchParams();
  appendDateRangeToQuery(query, filter);
  if (filter.weekdays.length) query.set("w", filter.weekdays.join(","));
  if (filter.categories.length) {
    query.set("c", encodePipeSeparatedList(filter.categories));
  }
  if (filter.tags.length) {
    query.set("t", encodePipeSeparatedList(filter.tags));
  }
  return toQueryString(query);
}

export function categoryLabel(cat: string): string {
  return COLUMN_CATEGORY_NAMES[cat] ?? cat;
}

export {
  dateMatchesRange,
  dateMatchesWeekdays,
  formatDateRangeSummary,
};
