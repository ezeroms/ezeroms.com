import Link from "next/link";
import type { Column } from "@/types/content";
import {
  COLUMN_CATEGORY_NAMES,
} from "@/components/ColumnHeaderNav";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import { cn } from "@/lib/cn";

type Props = {
  items: Column[];
  currentCategory?: string;
  currentTag?: string;
};

export function ColumnList({ items, currentCategory, currentTag }: Props) {
  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        まだ記事がありません。
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2" id="column-articles-list">
      {items.map((item) => {
        const href = `/column/${item.slug}/`;
        const thumb = columnThumbSrc(item.body_html);
        const excerpt = columnExcerpt(item.body_html, 140);
        const category = item.column_category?.[0];
        const categoryLabel = category
          ? (COLUMN_CATEGORY_NAMES[category] ?? category)
          : null;

        return (
          <article
            key={item.id}
            className={cn(
              "mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card",
              "shadow-sm transition-shadow hover:shadow-md",
            )}
          >
            <Link href={href} className="block text-inherit no-underline">
              {thumb ? (
                <div className="overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt=""
                    className="m-0 block h-auto max-h-52 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-2 p-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                  <time dateTime={item.date}>{formatColumnDate(item.date)}</time>
                  {categoryLabel ? (
                    <>
                      <span aria-hidden>·</span>
                      <span
                        className={cn(
                          currentCategory === category && "font-semibold text-foreground",
                        )}
                      >
                        {categoryLabel}
                      </span>
                    </>
                  ) : null}
                </div>

                <h2 className="m-0 text-base font-semibold leading-snug tracking-tight text-foreground">
                  {item.title}
                </h2>

                {excerpt ? (
                  <p className="m-0 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {excerpt}
                  </p>
                ) : null}

                {(item.column_tag ?? []).length ? (
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {[...(item.column_tag ?? [])].sort().map((tag) => {
                      const active = currentTag === tag;
                      return (
                        <span
                          key={tag}
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-medium",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                ) : null}

                <p className="m-0 pt-1 text-[12px] font-medium text-foreground/70">
                  続きを読む →
                </p>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
