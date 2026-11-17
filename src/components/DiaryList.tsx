import type { Diary } from "@/types/content";
import { WritingIndexList } from "@/components/WritingIndexList";
import {
  diaryExcerpt,
  diaryPermalink,
  diaryThumbSrc,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import { diaryListTagHref } from "@/lib/content/diary-filter";

type Props = {
  items: Diary[];
  currentTag?: string;
  /** 記事 og / 本文画像が空のときのサムネフォールバック */
  fallbackThumbSrc?: string | null;
};

/** ダイアリー一覧。コラム一覧と同じ二列。見出しは日付。 */
export function DiaryList({
  items,
  currentTag,
  fallbackThumbSrc = null,
}: Props) {
  return (
    <WritingIndexList
      empty="まだメモがありません。"
      items={items.map((item) => {
        const dateLabel = formatDiaryDate(item.date);
        const tags = [...(item.diary_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );
        return {
          id: item.id,
          href: diaryPermalink(item.slug),
          label: dateLabel || "Diary",
          image: diaryThumbSrc(item.body_html, item.og_image, fallbackThumbSrc),
          dateTime: item.date,
          title: dateLabel,
          excerpt: diaryExcerpt(item.body_html, 160),
          tags: tags.slice(0, 4).map((tag) => ({
            label: tag,
            href: diaryListTagHref(tag),
            active: currentTag === tag,
          })),
        };
      })}
    />
  );
}
