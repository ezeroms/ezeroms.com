import { COLUMN_CATEGORY_NAMES } from "@/components/ColumnHeaderNav";
import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  parseWeekdayList,
  parseYearMonthList,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";
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

export function columnFilterActive(filter: ColumnFilterState): boolean {
  return (
    filter.months.length > 0 ||
    filter.weekdays.length > 0 ||
    filter.categories.length > 0 ||
    filter.tags.length > 0
  );
}

/** Parse `/column/?m=&w=&c=&t=` */
export function parseColumnFilter(
  searchParams: SearchParamsRecord,
): ColumnFilterState {
  return {
    months: parseYearMonthList(firstSearchParamValue(searchParams, "m")),
    weekdays: parseWeekdayList(firstSearchParamValue(searchParams, "w")),
    categories: decodePipeSeparatedList(
      firstSearchParamValue(searchParams, "c"),
    ),
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
  };
}

export function serializeColumnFilter(filter: ColumnFilterState): string {
  const query = new URLSearchParams();
  if (filter.months.length) query.set("m", filter.months.join(","));
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

export { dateMatchesMonths, dateMatchesWeekdays, formatMonthLabel };
