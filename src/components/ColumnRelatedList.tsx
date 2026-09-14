import type { Column } from "@/types/content";
import {
  ContentThumbCard,
  contentThumbCardListClassName,
} from "@/components/ContentThumbCard";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";

type Props = {
  items: Column[];
  /** 記事 og / 本文画像が空のときのサムネフォールバック */
  fallbackThumbSrc?: string | null;
};

/**
 * Column 詳細の Related posts。Diary と同じ枠付きカード。
 * 左に OGP、右に日付・タイトルと冒頭抜粋。
 */
export function ColumnRelatedList({
  items,
  fallbackThumbSrc = null,
}: Props) {
  if (!items.length) return null;

  return (
    <div className={contentThumbCardListClassName("max-w-none")}>
      {items.map((item) => {
        const dateLabel = formatColumnDate(item.date);
        return (
          <ContentThumbCard
            key={item.id}
            href={`/column/${item.slug}/`}
            title={item.title}
            thumbSrc={columnThumbSrc(
              item.body_html,
              item.og_image,
              item.slug,
              fallbackThumbSrc,
            )}
            dateTime={item.date}
            dateLabel={dateLabel}
            excerpt={columnExcerpt(item.body_html, 160)}
            excerptLines={3}
            thumbAspect="og"
          />
        );
      })}
    </div>
  );
}
