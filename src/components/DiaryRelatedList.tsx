import type { Diary } from "@/types/content";
import {
  ContentThumbCard,
  contentPlainListClassName,
} from "@/components/ContentThumbCard";
import {
  diaryExcerpt,
  diaryPermalink,
  diaryThumbSrc,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  items: Diary[];
  /** 記事 og / 本文画像が空のときのサムネフォールバック */
  fallbackThumbSrc?: string | null;
};

/**
 * Diary 詳細の Related posts。Column 一覧と同じ枠なし行。
 */
export function DiaryRelatedList({
  items,
  fallbackThumbSrc = null,
}: Props) {
  if (!items.length) return null;

  return (
    <div className={contentPlainListClassName("pt-0")}>
      {items.map((item) => {
        const dateLabel = formatDiaryDate(item.date);
        const tags = [...(item.diary_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );
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
            excerptLines={3}
            excerptClassName="text-[0.9375rem] leading-[1.7]"
            showTitle={false}
            footer={
              tags.length
                ? tags.slice(0, 4).map((tag) => (
                    <span key={tag} className={tagPillClass(false)}>
                      {tag}
                    </span>
                  ))
                : null
            }
            chrome="plain"
            thumbAspect="og"
          />
        );
      })}
    </div>
  );
}
