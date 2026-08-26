"use client";

import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { SectionFacetNav } from "@/components/SectionFacetNav";

type Props = {
  tags: string[];
  selectedTag?: string | null;
};

/**
 * Giants 一覧・詳細のスマホ用タグナビ（右下 FAB → ボトムシート）。
 */
export function GiantsTopicNav({ tags, selectedTag = null }: Props) {
  return (
    <SectionFacetNav
      items={tags}
      selected={selectedTag}
      allHref="/shoulders-of-giants/"
      hrefFor={(tag) =>
        `/shoulders-of-giants/${serializeGiantsFilter({ tags: [tag] })}`
      }
      ariaLabel="タグ一覧"
      sheetTitle="Tags"
      emptyLabel="タグがありません"
      chooseLabel="タグを選ぶ"
    />
  );
}
