import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";

export type GiantsFilterState = {
  topics: string[];
};

export function emptyGiantsFilter(): GiantsFilterState {
  return { topics: [] };
}

export function giantsFilterActive(filter: GiantsFilterState): boolean {
  return filter.topics.length > 0;
}

/**
 * Parse `/shoulders-of-giants/?t=topic1|topic2`
 * 旧形式の `?topic=`（単一）も受け付ける。
 */
export function parseGiantsFilter(
  searchParams: SearchParamsRecord,
): GiantsFilterState {
  const fromTopicsParam = decodePipeSeparatedList(
    firstSearchParamValue(searchParams, "t"),
  );
  if (fromTopicsParam.length) return { topics: fromTopicsParam };

  const legacyTopic = firstSearchParamValue(searchParams, "topic").trim();
  if (legacyTopic) {
    try {
      return { topics: [decodeURIComponent(legacyTopic)] };
    } catch {
      return { topics: [legacyTopic] };
    }
  }
  return emptyGiantsFilter();
}

export function serializeGiantsFilter(filter: GiantsFilterState): string {
  if (!filter.topics.length) return "";
  const query = new URLSearchParams();
  query.set("t", encodePipeSeparatedList(filter.topics));
  return `?${query.toString()}`;
}
