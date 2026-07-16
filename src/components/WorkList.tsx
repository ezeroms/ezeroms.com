import Link from "next/link";
import type { Work } from "@/types/content";
import { WORK_CATEGORY_NAMES } from "@/components/WorkHeaderNav";
import { formatWorkPeriod } from "@/lib/content/work-filter";
import { cn } from "@/lib/cn";

type Props = {
  items: Work[];
};

/** Portfolio-style work cards (image + title + role/client). */
export function WorkList({ items }: Props) {
  if (!items.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        条件に合う作品がありません。
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2" id="work-articles-list">
      {items.map((item) => {
        const href = `/works/creative/${item.slug}/`;
        const period = formatWorkPeriod(item.start_date, item.end_date);
        const category = item.work_category?.[0];
        const categoryLabel = category
          ? (WORK_CATEGORY_NAMES[category] ?? category)
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
              {item.image_url ? (
                <div className="overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt=""
                    className="m-0 block h-auto max-h-56 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-2 p-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                  {period ? <span>{period}</span> : null}
                  {period && categoryLabel ? <span aria-hidden>·</span> : null}
                  {categoryLabel ? <span>{categoryLabel}</span> : null}
                </div>

                <h2 className="m-0 text-base font-semibold leading-snug tracking-tight text-foreground">
                  {item.title}
                </h2>

                {(item.role || item.client) && (
                  <p className="m-0 text-[13px] leading-snug text-muted-foreground">
                    {[item.role, item.client].filter(Boolean).join(" / ")}
                  </p>
                )}

                {(item.work_tag ?? []).length ? (
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {[...(item.work_tag ?? [])].sort().map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
