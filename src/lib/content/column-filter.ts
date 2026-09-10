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
} from "@/lib/content/diary-filter";

export type ColumnFilterState = {
  from: string | null;
  to: string | null;
  weekdays: number[];
  tags: string[];
};

export function emptyColumnFilter(): ColumnFilterState {
  return { ...emptyDateRange(), weekdays: [], tags: [] };
}

export function columnFilterActive(filter: ColumnFilterState): boolean {
  return (
    dateRangeActive(filter) ||
    filter.weekdays.length > 0 ||
    filter.tags.length > 0
  );
}

/** Parse `/column/?from=&to=&w=&t=`（旧 `m=` / `c=` は無視） */
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
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
  };
}

export function serializeColumnFilter(filter: ColumnFilterState): string {
  const query = new URLSearchParams();
  appendDateRangeToQuery(query, filter);
  if (filter.weekdays.length) query.set("w", filter.weekdays.join(","));
  if (filter.tags.length) {
    query.set("t", encodePipeSeparatedList(filter.tags));
  }
  return toQueryString(query);
}

export function columnTagHref(tag: string): string {
  return `/column/${serializeColumnFilter({
    ...emptyColumnFilter(),
    tags: [tag],
  })}`;
}

export {
  dateMatchesRange,
  dateMatchesWeekdays,
  formatDateRangeSummary,
};
