import Link from "next/link";
import type { Diary } from "@/types/content";
import {
  diaryPermalink,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import { tagPillClass } from "@/lib/site/tag-styles";
import { articleBodyClass } from "@/lib/site/prose-styles";
import { ArticleProse } from "@/components/ArticleProse";
import { ShareButton } from "@/components/ShareButton";

type Props = {
  item: Diary;
  /** Already sanitized body HTML */
  bodyHtml: string;
};

/**
 * Diary の個別詳細。一覧（DiaryTimeline）と同じ枠なしの紙面。
 */
export function DiaryArticle({ item, bodyHtml }: Props) {
  const tags = [...(item.diary_tag ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  const dateLabel = formatDiaryDate(item.date);
  const permalink = diaryPermalink(item.slug);

  return (
    <div className="w-full font-sans text-foreground">
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <article className="mx-auto min-w-0 w-full max-w-2xl overflow-visible py-4">
        <div className="mb-4">
          <h1 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground min-[768px]:text-3xl">
            <time dateTime={item.date}>{dateLabel}</time>
          </h1>
        </div>

        <ArticleProse className={articleBodyClass} html={bodyHtml} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/diary_tag/${encodeURIComponent(tag)}/`}
              className={tagPillClass(false)}
              data-tag={tag}
            >
              {tag}
            </Link>
          ))}
          <ShareButton path={permalink} />
        </div>
      </article>
    </div>
  );
}
