"use client";

import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { SectionFacetNav } from "@/components/SectionFacetNav";

type Props = {
  topics: string[];
  selectedTopic?: string | null;
};

/**
 * Giants 一覧・詳細共通のトピックナビ。
 * PC（≥1080）: 左カラム縦リスト
 * スマホ／タブレット: 右下 FAB → ボトムシート
 */
export function GiantsTopicNav({ topics, selectedTopic = null }: Props) {
  return (
    <SectionFacetNav
      items={topics}
      selected={selectedTopic}
      allHref="/shoulders-of-giants/"
      hrefFor={(topic) =>
        `/shoulders-of-giants/${serializeGiantsFilter({ topics: [topic] })}`
      }
      ariaLabel="トピック一覧"
      sheetTitle="トピック"
      emptyLabel="トピックがありません"
      chooseLabel="トピックを選ぶ"
    />
  );
}
