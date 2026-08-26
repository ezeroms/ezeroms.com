"use client";

import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { SectionFacetNav } from "@/components/SectionFacetNav";

type Props = {
  tags: string[];
  selectedTag?: string | null;
};

/**
 * Giants 一覧・詳細共通のタグナビ。
 * PC（≥1080）: 左カラム縦リスト
 * スマホ／タブレット: 右下 FAB → ボトムシート
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
      sheetTitle="タグ"
      emptyLabel="タグがありません"
      chooseLabel="タグを選ぶ"
    />
  );
}
