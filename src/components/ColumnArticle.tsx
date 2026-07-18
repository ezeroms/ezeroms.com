import Link from "next/link";
import type { Column } from "@/types/content";
import { COLUMN_CATEGORY_NAMES } from "@/components/ColumnHeaderNav";
import { formatColumnDate } from "@/lib/content/column-meta";
import { serializeColumnFilter } from "@/lib/content/column-filter";
import { prepareColumnToc } from "@/lib/content/column-toc";
import { cn } from "@/lib/cn";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { contentCard } from "@/lib/site/card-styles";
import { tagChipClass } from "@/lib/site/tag-styles";

type Props = {
  item: Column;
  /** Already sanitized body HTML */
  bodyHtml: string;
};

/**
 * Column 詳細。メインはシングルカラムの読み物カードのみ。
 * （見出し ID 付与のため prepareColumnToc は利用するが、右サイド目次は出さない）
 */
export function ColumnArticle({ item, bodyHtml }: Props) {
  const { html } = prepareColumnToc(bodyHtml);
  const category = item.column_category?.[0];
  const categoryLabel = category
    ? (COLUMN_CATEGORY_NAMES[category] ?? category)
    : null;
  const tags = [...(item.column_tag ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );

  return (
    <div className="w-full font-sans text-foreground">
      <article
        className={contentCard({
          className: "mx-auto min-w-0 w-full max-w-3xl p-6 sm:p-8",
        })}
      >
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
              <time dateTime={item.date}>{formatColumnDate(item.date)}</time>
              {categoryLabel ? (
                <>
                  <span aria-hidden>·</span>
                  <Link
                    href={`/column/${serializeColumnFilter({
                      months: [],
                      weekdays: [],
                      categories: [category!],
                      tags: [],
                    })}`}
                    className="truncate no-underline hover:underline"
                  >
                    {categoryLabel}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <h1 className="m-0 text-2xl font-semibold leading-relaxed tracking-tight text-foreground sm:text-3xl">
          {item.title}
        </h1>

        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/column/${serializeColumnFilter({
                  months: [],
                  weekdays: [],
                  categories: [],
                  tags: [tag],
                })}`}
                className={tagChipClass(false)}
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="my-6 h-px w-full bg-border" aria-hidden />

        <div
          className={cn(
            notesBodyClass,
            // Column 向けの見出し・引用・コード（Notes 共通の上に足す）
            "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
            "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight",
            "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
            "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-sm",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm",
            "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_figure]:my-6",
            "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
