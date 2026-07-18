/**
 * 写真ギャラリーの絞り込みクエリ（年）。
 * Smile / Jampai / Kuikake の公開 UI ではタグ絞り込みは使わない。
 */

import {
  firstSearchParamValue,
  parseYearList,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";

export type PhotoFilterState = {
  years: string[];
  /**
   * 互換のため残している。公開 UI では常に空配列。
   * （データ上の photo_tag や admin 側とは別系統）
   */
  tags: string[];
};

export function emptyPhotoFilter(): PhotoFilterState {
  return { years: [], tags: [] };
}

export function photoFilterActive(filter: PhotoFilterState): boolean {
  return filter.years.length > 0;
}

/** URL の `?y=2024,2025` をフィルタ状態に変換する。 */
export function parsePhotoFilter(
  searchParams: SearchParamsRecord,
): PhotoFilterState {
  return {
    years: parseYearList(firstSearchParamValue(searchParams, "y")),
    tags: [],
  };
}

export function serializePhotoFilter(filter: PhotoFilterState): string {
  const query = new URLSearchParams();
  if (filter.years.length) {
    query.set("y", filter.years.join(","));
  }
  return toQueryString(query);
}

export function photoYear(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return String(parsed.getFullYear());
}

export function formatPhotoDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
