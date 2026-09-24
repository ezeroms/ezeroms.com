import { ArticleProse } from "@/components/ArticleProse";
import Link from "next/link";
import type { Column } from "@/types/content";
import { formatColumnDate } from "@/lib/content/column-meta";
import { serializeColumnFilter, emptyColumnFilter } from "@/lib/content/column-filter";
import { prepareColumnToc } from "@/lib/content/column-toc";
import { cn } from "@/lib/cn";
import { articleBodyClass, articleDetailClass } from "@/lib/site/prose-styles";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  item: Column;
  /** Already sanitized body HTML */
  bodyHtml: string;
};

/**
 * Column 詳細。一覧と同じ枠なしの紙面。
 * （見出し ID 付与のため prepareColumnToc は利用するが、右サイド目次は出さない）
 */
export function ColumnArticle({ item, bodyHtml }: Props) {
  const { html } = prepareColumnToc(bodyHtml);
  const tags = [...(item.column_tag ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );

  return (
    <div className="w-full font-sans text-foreground">
      <article className="mx-auto min-w-0 w-full max-w-2xl overflow-visible py-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-1.5 text-sm leading-tight text-muted-foreground">
          <time dateTime={item.date}>{formatColumnDate(item.date)}</time>
        </div>

        <h1 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground min-[768px]:text-3xl">
          {item.title}
        </h1>

        {tags.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/column/${serializeColumnFilter({
                  ...emptyColumnFilter(),
                  tags: [tag],
                })}`}
                className={tagPillClass(false)}
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}

        <ArticleProse
          html={html}
          className={cn(
            "mt-8",
            articleBodyClass,
            articleDetailClass,
            // 見出し margin を区切り線の余白に足さない（Diary の hr と同じ上下 1rem）
            "[&_hr+h2]:mt-0 [&_hr+h3]:mt-0 [&_h2:has(+hr)]:mb-0 [&_h3:has(+hr)]:mb-0",
          )}
        />
      </article>
    </div>
  );
}
