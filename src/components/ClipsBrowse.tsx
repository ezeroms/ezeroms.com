import type { Clip } from "@/types/content";
import { ClipList } from "@/components/ClipList";
import type { DiaryFilterState } from "@/lib/content/diary-filter";

type Props = {
  tags: string[];
  items: Clip[];
  selectedTag?: string | null;
  dateFilter?: Pick<DiaryFilterState, "from" | "to">;
  fallbackThumbSrc?: string | null;
};

/**
 * Clips 一覧本体。タグは SiteShell 右レール（ReadingTopicsAside）。
 */
export function ClipsBrowse({
  items,
  selectedTag = null,
  dateFilter,
  fallbackThumbSrc = null,
}: Props) {
  return (
    <ClipList
      items={items}
      currentTag={selectedTag}
      dateFilter={dateFilter}
      fallbackThumbSrc={fallbackThumbSrc}
    />
  );
}
