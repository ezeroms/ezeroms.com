import { WORK_CATEGORY_NAMES } from "@/components/WorkHeaderNav";
import {
  appendDateRangeToQuery,
  dateRangeActive,
  emptyDateRange,
  formatDateRangeSummary,
  isoDateInRange,
  parseDateRangeFromSearchParams,
} from "@/lib/content/date-range";
import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";
import type { WorkKind } from "@/types/content";

export type WorkFilterState = {
  from: string | null;
  to: string | null;
  categories: string[];
  tags: string[];
  clients: string[];
  kinds: WorkKind[];
};

export const WORK_KIND_LABELS: Record<WorkKind, string> = {
  product: "プロダクト",
  commission: "受託制作",
  involvement: "関与・コラボ",
};

export function emptyWorkFilter(): WorkFilterState {
  return {
    ...emptyDateRange(),
    categories: [],
    tags: [],
    clients: [],
    kinds: [],
  };
}

export function workFilterActive(filter: WorkFilterState): boolean {
  return (
    dateRangeActive(filter) ||
    filter.categories.length > 0 ||
    filter.tags.length > 0 ||
    filter.clients.length > 0 ||
    filter.kinds.length > 0
  );
}

function isWorkKind(value: string): value is WorkKind {
  return (
    value === "product" ||
    value === "commission" ||
    value === "involvement"
  );
}

/** Parse `?from=&to=&c=&t=&cl=&k=`（旧 `y=` も可） */
export function parseWorkFilter(
  searchParams: SearchParamsRecord,
): WorkFilterState {
  const kinds = firstSearchParamValue(searchParams, "k")
    .split(",")
    .map((part) => part.trim())
    .filter(isWorkKind);
  const range = parseDateRangeFromSearchParams(searchParams, {
    legacyYearsKey: "y",
  });

  return {
    from: range.from,
    to: range.to,
    categories: decodePipeSeparatedList(
      firstSearchParamValue(searchParams, "c"),
    ),
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
    clients: decodePipeSeparatedList(firstSearchParamValue(searchParams, "cl")),
    kinds,
  };
}

export function serializeWorkFilter(filter: WorkFilterState): string {
  const query = new URLSearchParams();
  appendDateRangeToQuery(query, filter);
  if (filter.categories.length) {
    query.set("c", encodePipeSeparatedList(filter.categories));
  }
  if (filter.tags.length) {
    query.set("t", encodePipeSeparatedList(filter.tags));
  }
  if (filter.clients.length) {
    query.set("cl", encodePipeSeparatedList(filter.clients));
  }
  if (filter.kinds.length) query.set("k", filter.kinds.join(","));
  return toQueryString(query);
}

export function workCategoryLabel(cat: string): string {
  return WORK_CATEGORY_NAMES[cat] ?? cat;
}

/** Prefer start_date, fall back to date */
export function workPrimaryDate(item: {
  start_date: string | null;
  date: string;
}): Date {
  if (item.start_date) {
    const parsed = new Date(item.start_date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(item.date);
}

export function workYear(item: {
  start_date: string | null;
  date: string;
}): string {
  const parsed = workPrimaryDate(item);
  if (Number.isNaN(parsed.getTime())) return "";
  return String(parsed.getFullYear());
}

export function workMatchesDateRange(
  item: { start_date: string | null; date: string },
  range: { from: string | null; to: string | null },
): boolean {
  const primary = item.start_date || item.date;
  return isoDateInRange(primary, range);
}

export function formatWorkPeriod(
  startDate: string | null,
  endDate: string | null,
): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const startLabel = start.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  if (!endDate) return `${startLabel} –`;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;
  const endLabel = end.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  return `${startLabel} – ${endLabel}`;
}

export function normalizeWorkRow<T extends Record<string, unknown>>(
  row: T,
): T & {
  work_kind: WorkKind;
  product_key: string | null;
  work_category: string[];
  work_tag: string[];
} {
  const kind = row.work_kind;
  const work_kind: WorkKind =
    kind === "product" || kind === "involvement" || kind === "commission"
      ? kind
      : "commission";
  return {
    ...row,
    work_kind,
    product_key: (row.product_key as string | null | undefined) ?? null,
    work_category: (row.work_category as string[] | null | undefined) ?? [],
    work_tag: (row.work_tag as string[] | null | undefined) ?? [],
    og_image: String(row.og_image ?? ""),
  };
}

export { formatDateRangeSummary };
