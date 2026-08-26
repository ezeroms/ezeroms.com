import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";

export type GiantsFilterState = {
  tags: string[];
};

export function emptyGiantsFilter(): GiantsFilterState {
  return { tags: [] };
}

export function giantsFilterActive(filter: GiantsFilterState): boolean {
  return filter.tags.length > 0;
}

/**
 * Parse `/shoulders-of-giants/?t=tag1|tag2`
 * 旧形式の `?topic=`（単一）も受け付ける。
 */
export function parseGiantsFilter(
  searchParams: SearchParamsRecord,
): GiantsFilterState {
  const fromTagsParam = decodePipeSeparatedList(
    firstSearchParamValue(searchParams, "t"),
  );
  if (fromTagsParam.length) return { tags: fromTagsParam };

  const legacyTopic = firstSearchParamValue(searchParams, "topic").trim();
  if (legacyTopic) {
    try {
      return { tags: [decodeURIComponent(legacyTopic)] };
    } catch {
      return { tags: [legacyTopic] };
    }
  }
  return emptyGiantsFilter();
}

export function serializeGiantsFilter(filter: GiantsFilterState): string {
  if (!filter.tags.length) return "";
  const query = new URLSearchParams();
  query.set("t", encodePipeSeparatedList(filter.tags));
  return `?${query.toString()}`;
}

export function giantsTagHref(tag: string): string {
  return `/shoulders-of-giants/${serializeGiantsFilter({ tags: [tag] })}`;
}
