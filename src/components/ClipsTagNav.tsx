"use client";

import {
  emptyDiaryFilter,
  serializeDiaryFilter,
  type DiaryFilterState,
} from "@/lib/content/diary-filter";
import { SectionFacetNav } from "@/components/SectionFacetNav";

type Props = {
  tags: string[];
  selectedTag?: string | null;
  /** タグ切替時に時期フィルタを残す */
  dateFilter?: Pick<DiaryFilterState, "from" | "to">;
};

function clipsHref(tag: string | null, dateFilter?: Pick<DiaryFilterState, "from" | "to">) {
  return `/clips/${serializeDiaryFilter({
    ...emptyDiaryFilter(),
    from: dateFilter?.from ?? null,
    to: dateFilter?.to ?? null,
    tags: tag ? [tag] : [],
  })}`;
}

/**
 * Clips 一覧のタグナビ（Giants トピックナビと同型）。
 */
export function ClipsTagNav({
  tags,
  selectedTag = null,
  dateFilter,
}: Props) {
  return (
    <SectionFacetNav
      items={tags}
      selected={selectedTag}
      allHref={clipsHref(null, dateFilter)}
      hrefFor={(tag) => clipsHref(tag, dateFilter)}
      ariaLabel="タグ一覧"
      sheetTitle="タグ"
      emptyLabel="タグがありません"
      chooseLabel="タグを選ぶ"
    />
  );
}
