import type { Clip } from "@/types/content";
import { ClipList } from "@/components/ClipList";
import { ClipsTagNav } from "@/components/ClipsTagNav";
import type { DiaryFilterState } from "@/lib/content/diary-filter";

type Props = {
  tags: string[];
  items: Clip[];
  selectedTag?: string | null;
  dateFilter?: Pick<DiaryFilterState, "from" | "to">;
  fallbackThumbSrc?: string | null;
};

/**
 * Clips 一覧本体。
 * PC: SiteShell 右レール / スマホ: 右下 FAB → ボトムシート。
 */
export function ClipsBrowse({
  items,
  selectedTag = null,
  dateFilter,
  fallbackThumbSrc = null,
  tags,
}: Props) {
  return (
    <>
      <ClipsTagNav
        tags={tags}
        selectedTag={selectedTag}
        dateFilter={dateFilter}
      />
      <ClipList
        items={items}
        currentTag={selectedTag}
        dateFilter={dateFilter}
        fallbackThumbSrc={fallbackThumbSrc}
      />
    </>
  );
}
