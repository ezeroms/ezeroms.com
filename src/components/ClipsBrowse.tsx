import type { Clip } from "@/types/content";
import { ClipList } from "@/components/ClipList";
import { ClipsTagNav } from "@/components/ClipsTagNav";
import { cn } from "@/lib/cn";
import type { DiaryFilterState } from "@/lib/content/diary-filter";

type Props = {
  tags: string[];
  items: Clip[];
  selectedTag?: string | null;
  dateFilter?: Pick<DiaryFilterState, "from" | "to">;
  fallbackThumbSrc?: string | null;
};

/**
 * 左: タグ一覧（Giants と同型）
 * 右: Column / Creative と同型のサムネカード
 */
export function ClipsBrowse({
  tags,
  items,
  selectedTag = null,
  dateFilter,
  fallbackThumbSrc = null,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        "min-[1080px]:min-h-0 min-[1080px]:flex-1 min-[1080px]:flex-row min-[1080px]:gap-8 min-[1080px]:overflow-hidden",
      )}
    >
      <ClipsTagNav
        tags={tags}
        selectedTag={selectedTag}
        dateFilter={dateFilter}
      />

      <div
        className={cn(
          "min-w-0 flex-1 font-sans",
          "min-[1080px]:min-h-0 min-[1080px]:overflow-y-auto",
        )}
      >
        <ClipList
          items={items}
          currentTag={selectedTag}
          fallbackThumbSrc={fallbackThumbSrc}
        />
      </div>
    </div>
  );
}
