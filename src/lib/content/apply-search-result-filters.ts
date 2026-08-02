/**
 * キーワード検索結果に、一覧と同じ絞り込みクエリを後段適用する。
 */

import {
  chronicleFilterActive,
  chronicleMatchesAnyInterest,
  chronicleMatchesDateRange,
  parseChronicleFilter,
} from "@/lib/content/chronicle-filter";
import {
  columnFilterActive,
  dateMatchesRange,
  parseColumnFilter,
} from "@/lib/content/column-filter";
import { isoDateInRange } from "@/lib/content/date-range";
import type { SearchParamsRecord } from "@/lib/content/filter-search-params";
import {
  dateMatchesWeekdays,
  notesFilterActive,
  parseNotesFilter,
} from "@/lib/content/notes-filter";
import type { SearchScopeId } from "@/lib/content/search-scope";
import {
  parseWorkFilter,
  workFilterActive,
  workMatchesDateRange,
} from "@/lib/content/work-filter";
import type { WorkKind } from "@/types/content";

function paramsRecordFromSearch(search: string): SearchParamsRecord {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const record: SearchParamsRecord = {};
  params.forEach((value, key) => {
    const existing = record[key];
    if (existing == null) {
      record[key] = value;
      return;
    }
    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }
    record[key] = [existing, value];
  });
  return record;
}

function overlaps(haystack: string[] | null | undefined, needles: string[]) {
  if (!needles.length) return true;
  const set = new Set(haystack ?? []);
  return needles.some((n) => set.has(n));
}

/**
 * `/…/search/?q=…&from=…` のように付いた絞り込みを、検索ヒットに適用する。
 */
export function applySearchResultFilters(
  scope: SearchScopeId,
  records: Record<string, unknown>[],
  search: string,
): Record<string, unknown>[] {
  const params = paramsRecordFromSearch(search);

  if (scope === "notes") {
    const filter = parseNotesFilter(params);
    if (!notesFilterActive(filter)) return records;
    return records.filter((row) => {
      const date = String(row.date ?? "");
      if (!isoDateInRange(date, filter)) return false;
      if (!dateMatchesWeekdays(date, filter.weekdays)) return false;
      if (!overlaps(row.diary_tag as string[] | undefined, filter.tags)) {
        return false;
      }
      if (filter.places.length) {
        const place = (row.diary_place as string | null) ?? "";
        if (!filter.places.includes(place)) return false;
      }
      return true;
    });
  }

  if (scope === "clips") {
    const filter = parseNotesFilter(params);
    const clipFilter = {
      ...filter,
      places: [] as string[],
      weekdays: [] as number[],
    };
    if (!notesFilterActive(clipFilter)) return records;
    return records.filter((row) => {
      const date = String(row.date ?? "");
      if (!isoDateInRange(date, clipFilter)) return false;
      return overlaps(row.clip_tag as string[] | undefined, clipFilter.tags);
    });
  }

  if (scope === "column") {
    const filter = parseColumnFilter(params);
    if (!columnFilterActive(filter)) return records;
    return records.filter((row) => {
      const date = String(row.date ?? "");
      if (!dateMatchesRange(date, filter)) return false;
      if (
        !overlaps(
          row.column_category as string[] | undefined,
          filter.categories,
        )
      ) {
        return false;
      }
      return overlaps(row.column_tag as string[] | undefined, filter.tags);
    });
  }

  if (scope === "creative") {
    const filter = parseWorkFilter(params);
    if (!workFilterActive(filter)) return records;
    return records.filter((row) => {
      if (
        !workMatchesDateRange(
          {
            start_date: (row.start_date as string | null) ?? null,
            date: String(row.date ?? ""),
          },
          filter,
        )
      ) {
        return false;
      }
      if (
        !overlaps(
          row.work_category as string[] | undefined,
          filter.categories,
        )
      ) {
        return false;
      }
      if (!overlaps(row.work_tag as string[] | undefined, filter.tags)) {
        return false;
      }
      if (filter.clients.length) {
        const client = ((row.client as string | null) ?? "").trim();
        if (!filter.clients.includes(client)) return false;
      }
      if (filter.kinds.length) {
        const kind = row.work_kind as WorkKind | undefined;
        if (!kind || !filter.kinds.includes(kind)) return false;
      }
      return true;
    });
  }

  if (scope === "chronicle") {
    const filter = parseChronicleFilter(params);
    if (!chronicleFilterActive(filter)) return records;
    return records.filter((row) => {
      if (
        !chronicleMatchesDateRange({ date: String(row.date ?? "") }, filter)
      ) {
        return false;
      }
      const item = {
        category: (row.category as string | null) ?? null,
        subcategory: (row.subcategory as string | null) ?? null,
        chronicle_tag: (row.chronicle_tag as string[] | null) ?? [],
      };
      if (!chronicleMatchesAnyInterest(item, filter.interests)) return false;
      return overlaps(item.chronicle_tag, filter.tags);
    });
  }

  return records;
}
