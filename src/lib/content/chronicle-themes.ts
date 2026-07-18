import type { Chronicle } from "@/types/content";

export const CHRONICLE_OTHER_THEME = "その他";

/** 表示するテーマ列を決める。フィルタ指定がなければ全タグ（50音順）。 */
export function resolveChronicleThemes(
  allTags: string[],
  filterTags: string[],
  items: Chronicle[],
): string[] {
  const base = (filterTags.length ? filterTags : allTags)
    .map((t) => t.trim())
    .filter(Boolean);
  const unique = [...new Set(base)].sort((a, b) => a.localeCompare(b, "ja"));

  const hasUntagged = items.some(
    (item) => !(item.chronicle_tag ?? []).length,
  );
  if (hasUntagged && !filterTags.length) {
    return [...unique, CHRONICLE_OTHER_THEME];
  }
  return unique;
}
