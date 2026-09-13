import type { Diary } from "@/types/content";
import {
  ContentThumbCard,
  contentThumbCardListClassName,
} from "@/components/ContentThumbCard";
import {
  diaryExcerpt,
  diaryPermalink,
  diaryThumbSrc,
  formatDiaryDate,
} from "@/lib/content/diary-meta";

type Props = {
  items: Diary[];
  /** 記事 og / 本文画像が空のときのサムネフォールバック */
  fallbackThumbSrc?: string | null;
};

/**
 * Diary 詳細の Related posts。枠付きカードで、左に OGP、右に日付と冒頭抜粋。
 */
export function DiaryRelatedList({
  items,
  fallbackThumbSrc = null,
}: Props) {
  if (!items.length) return null;

  return (
    <div className={contentThumbCardListClassName("max-w-none")}>
      {items.map((item) => {
        const dateLabel = formatDiaryDate(item.date);
        return (
          <ContentThumbCard
            key={item.id}
            href={diaryPermalink(item.slug)}
            title={dateLabel || "Diary"}
            thumbSrc={diaryThumbSrc(
              item.body_html,
              item.og_image,
              fallbackThumbSrc,
            )}
            dateTime={item.date}
            dateLabel={dateLabel}
            excerpt={diaryExcerpt(item.body_html, 160)}
            showTitle={false}
            excerptLines={3}
          />
        );
      })}
    </div>
  );
}
