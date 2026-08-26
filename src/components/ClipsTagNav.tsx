"use client";

import { type DiaryFilterState } from "@/lib/content/diary-filter";
import { clipHrefsForDate } from "@/lib/content/clip-meta";
import {
  TAGS_BOTTOM_SHEET_COPY,
  TagsBottomSheet,
} from "@/components/TagsBottomSheet";

type Props = {
  tags: string[];
  selectedTag?: string | null;
  /** タグ切替時に時期フィルタを残す */
  dateFilter?: Pick<DiaryFilterState, "from" | "to">;
};

/**
 * Giants タグナビと同型。右下 FAB → ボトムシート。
 */
export function ClipsTagNav({
  tags,
  selectedTag = null,
  dateFilter,
}: Props) {
  const hrefs = clipHrefsForDate(dateFilter);
  return (
    <TagsBottomSheet
      items={tags}
      selected={selectedTag}
      allHref={hrefs.all}
      hrefFor={hrefs.forTag}
      {...TAGS_BOTTOM_SHEET_COPY}
    />
  );
}
