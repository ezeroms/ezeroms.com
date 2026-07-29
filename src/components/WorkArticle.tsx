import Link from "next/link";
import { ArticleProse } from "@/components/ArticleProse";
import { WORK_CATEGORY_NAMES } from "@/components/WorkHeaderNav";
import type { Work } from "@/types/content";
import {
  emptyWorkFilter,
  formatWorkPeriod,
  serializeWorkFilter,
} from "@/lib/content/work-filter";
import { OG_IMAGE_ASPECT_CLASS } from "@/lib/content/og-image";
import { cn } from "@/lib/cn";
import { contentCard } from "@/lib/site/card-styles";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { tagChipClass } from "@/lib/site/tag-styles";

type Props = {
  item: Work;
  /** Already sanitized body HTML */
  bodyHtml: string;
};

/**
 * Creative 詳細。Column 詳細と同型の読み物カード。
 */
export function WorkArticle({ item, bodyHtml }: Props) {
  const period = formatWorkPeriod(item.start_date, item.end_date);
  const category = item.work_category?.[0];
  const categoryLabel = category
    ? (WORK_CATEGORY_NAMES[category] ?? category)
    : null;
  const tags = [...(item.work_tag ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  const coverSrc = item.image_url || item.og_image || "";
  const creditLine = [item.role, item.client, item.agency]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(" / ");

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
              {period ? <span>{period}</span> : null}
              {period && categoryLabel ? <span aria-hidden>·</span> : null}
              {categoryLabel ? (
                <Link
                  href={`/works/creative/${serializeWorkFilter({
                    ...emptyWorkFilter(),
                    categories: [category!],
                  })}`}
                  className="truncate no-underline hover:underline"
                >
                  {categoryLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <h1 className="m-0 text-2xl font-semibold leading-relaxed tracking-tight text-foreground sm:text-3xl">
          {item.title}
        </h1>

        {creditLine ? (
          <p className="m-0 mt-2 text-sm leading-snug text-muted-foreground">
            {creditLine}
          </p>
        ) : null}

        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/works/creative/${serializeWorkFilter({
                  ...emptyWorkFilter(),
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

        {coverSrc ? (
          <div
            className={cn(
              "mb-6 overflow-hidden rounded-lg bg-muted",
              OG_IMAGE_ASPECT_CLASS,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt=""
              className="m-0 block h-full w-full object-cover"
            />
          </div>
        ) : null}

        {bodyHtml.trim() ? (
          <ArticleProse
            html={bodyHtml}
            className={cn(
              notesBodyClass,
              "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
              "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight",
              "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
              "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]",
              "[&_figure]:my-6",
              "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground",
            )}
          />
        ) : null}
      </article>
    </div>
  );
}
