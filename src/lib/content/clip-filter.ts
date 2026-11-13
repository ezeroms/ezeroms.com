import {
  appendDateRangeToQuery,
  dateRangeActive,
  emptyDateRange,
  parseDateRangeFromSearchParams,
} from "@/lib/content/date-range";
import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";

export type ClipFilterState = {
  from: string | null;
  to: string | null;
  tags: string[];
};

export function emptyClipFilter(): ClipFilterState {
  return { ...emptyDateRange(), tags: [] };
}

export function clipFilterActive(filter: ClipFilterState): boolean {
  return dateRangeActive(filter) || filter.tags.length > 0;
}

/**
 * Parse `/clips/?from=&to=&t=`
 * 旧 `m=`（年月）も日付レンジに戻す。曜日・場所は Diary 専用なので読まない。
 */
export function parseClipFilter(
  searchParams: SearchParamsRecord,
): ClipFilterState {
  const range = parseDateRangeFromSearchParams(searchParams, {
    legacyMonthsKey: "m",
  });
  return {
    from: range.from,
    to: range.to,
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
  };
}

export function serializeClipFilter(filter: ClipFilterState): string {
  const query = new URLSearchParams();
  appendDateRangeToQuery(query, filter);
  if (filter.tags.length) {
    query.set("t", encodePipeSeparatedList(filter.tags));
  }
  return toQueryString(query);
}
