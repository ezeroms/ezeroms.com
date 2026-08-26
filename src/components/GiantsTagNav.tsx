"use client";

import { giantsTagHref } from "@/lib/content/giants-filter";
import {
  TAGS_BOTTOM_SHEET_COPY,
  TagsBottomSheet,
} from "@/components/TagsBottomSheet";

type Props = {
  tags: string[];
  selectedTag?: string | null;
};

/**
 * Giants 一覧・詳細のスマホ用タグナビ（右下 FAB → ボトムシート）。
 */
export function GiantsTagNav({ tags, selectedTag = null }: Props) {
  return (
    <TagsBottomSheet
      items={tags}
      selected={selectedTag}
      allHref="/shoulders-of-giants/"
      hrefFor={giantsTagHref}
      {...TAGS_BOTTOM_SHEET_COPY}
    />
  );
}
