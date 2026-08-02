import Link from "next/link";
import type { Diary } from "@/types/content";
import {
  notesPermalink,
  formatNotesDate,
} from "@/lib/content/notes-meta";
import { tagChipClass } from "@/lib/site/tag-styles";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { ArticleProse } from "@/components/ArticleProse";
import { ShareButton } from "@/components/ShareButton";
import { contentCard } from "@/lib/site/card-styles";

type Props = {
  item: Diary;
  /** Already sanitized body HTML */
  bodyHtml: string;
};

/**
 * Notes（公開 URL / DB は diary）の個別詳細。
 * カード内レイアウトは一覧（NotesTimeline）に揃える。
 */
export function NoteArticle({ item, bodyHtml }: Props) {
  const tags = [...(item.diary_tag ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  const dateLabel = formatNotesDate(item.date);
  const permalink = notesPermalink(item.slug);

  return (
    <div className="w-full font-sans text-foreground">
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <article className={contentCard({ className: "mx-auto min-w-0 w-full max-w-3xl overflow-visible p-6" })}>
        <div className="mb-4 flex items-start gap-3">
          <Link
            href="/about/me/"
            className="shrink-0"
            aria-label="プロフィール"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/about/profile.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href="/about/me/"
              className="text-sm font-semibold leading-tight text-foreground no-underline hover:underline"
            >
              ezeroms
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm leading-tight text-muted-foreground">
              <Link href={permalink} className="no-underline hover:underline">
                <time dateTime={item.date}>{dateLabel}</time>
              </Link>
              {item.diary_place ? (
                <>
                  <span aria-hidden>·</span>
                  <Link
                    href={`/diary_place/${encodeURIComponent(item.diary_place)}/`}
                    className="truncate no-underline hover:underline"
                  >
                    {item.diary_place}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <ArticleProse className={notesBodyClass} html={bodyHtml} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/diary_tag/${encodeURIComponent(tag)}/`}
              className={tagChipClass(false)}
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
