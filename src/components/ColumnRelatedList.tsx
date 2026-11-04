import type { Column } from "@/types/content";
import { ColumnList } from "@/components/ColumnList";

type Props = {
  items: Column[];
  /** 記事 og / 本文画像が空のときのサムネフォールバック */
  fallbackThumbSrc?: string | null;
};

/**
 * Column 詳細の Related posts。一覧と同じ枠なし行。
 */
export function ColumnRelatedList({
  items,
  fallbackThumbSrc = null,
}: Props) {
  return (
    <ColumnList
      items={items}
      hideEmpty
      fallbackThumbSrc={fallbackThumbSrc}
      className="pt-0"
    />
  );
}
