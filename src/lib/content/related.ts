/**
 * Rank candidates by shared-tag count (desc), then by date (newer first).
 */
export function rankBySharedTags<T extends { slug: string; date: string }>(opts: {
  currentSlug: string;
  currentTags: string[];
  candidates: T[];
  getTags: (item: T) => string[] | null | undefined;
  limit?: number;
}): T[] {
  const { currentSlug, currentTags, candidates, getTags, limit = 6 } = opts;
  if (!currentTags.length || limit <= 0) return [];

  const tagSet = new Set(currentTags);
  return candidates
    .filter((item) => item.slug !== currentSlug)
    .map((item) => {
      const tags = getTags(item) ?? [];
      let shared = 0;
      for (const tag of tags) {
        if (tagSet.has(tag)) shared += 1;
      }
      return { item, shared };
    })
    .filter((row) => row.shared > 0)
    .sort((a, b) => {
      if (b.shared !== a.shared) return b.shared - a.shared;
      return b.item.date.localeCompare(a.item.date);
    })
    .slice(0, limit)
    .map((row) => row.item);
}
