import Link from "next/link";
import type { Column } from "@/types/content";
import { COLUMN_CATEGORY_NAMES } from "@/components/ColumnHeaderNav";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";
import { contentCard } from "@/lib/site/card-styles";

type Props = {
  items: Column[];
  currentCategory?: string;
  currentTag?: string;
  /** Skip the empty-state message (e.g. related block under a detail page). */
  hideEmpty?: boolean;
};

/**
 * Column 一覧: 左サムネはカード端まで隙間なく 1.91:1。
 * 高さはサムネ基準、右テキストは残り幅に収める。
 */
export function ColumnList({
  items,
  currentCategory,
  currentTag,
  hideEmpty,
}: Props) {
  if (!items.length) {
    if (hideEmpty) return null;
    return (
      <p className="py-10 text-sm text-muted-foreground">
        まだ記事がありません。
      </p>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      id="column-articles-list"
    >
      {items.map((item) => {
        const href = `/column/${item.slug}/`;
        const thumb = columnThumbSrc(item.body_html, item.og_image, item.slug);
        const excerpt = columnExcerpt(item.body_html, 120);
        const category = item.column_category?.[0];
        const categoryLabel = category
          ? (COLUMN_CATEGORY_NAMES[category] ?? category)
          : null;
        const tags = [...(item.column_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );

        return (
          <article
            key={item.id}
            className={contentCard({ link: true, className: "group" })}
          >
            <Link
              href={href}
              className="grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] items-stretch text-inherit no-underline sm:grid-cols-[minmax(0,40%)_minmax(0,1fr)]"
            >
              {/* カード端まで隙間なし。列幅 38–40% × 行高 ≒ 1.91:1 */}
              <div className="relative min-h-0 overflow-hidden bg-muted">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="absolute inset-0 m-0 block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-muted to-secondary/40 transition-transform duration-300 ease-out group-hover:scale-105"
                    aria-hidden
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-2 overflow-hidden px-4 py-4 sm:gap-2.5 sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-center gap-x-2 overflow-hidden text-sm leading-tight text-muted-foreground">
                  <time dateTime={item.date}>
                    {formatColumnDate(item.date)}
                  </time>
                  {categoryLabel ? (
                    <>
                      <span aria-hidden>·</span>
                      <span
                        className={cn(
                          currentCategory === category &&
                            "font-semibold text-foreground",
                        )}
                      >
                        {categoryLabel}
                      </span>
                    </>
                  ) : null}
                </div>

                <h2 className="m-0 line-clamp-2 text-base font-semibold leading-normal tracking-tight text-foreground">
                  {/* inline: 文字幅だけ underline。右余白 hover では線が付かない */}
                  <span className="hover:underline hover:underline-offset-2">
                    {item.title}
                  </span>
                </h2>

                <p className="m-0 mt-1 line-clamp-2 text-sm leading-normal text-muted-foreground">
                  {excerpt || "\u00A0"}
                </p>

                <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
                  {tags.slice(0, 4).map((tag) => {
                    const active = currentTag === tag;
                    return (
                      <span
                        key={tag}
                        className={tagChipClass(active)}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
