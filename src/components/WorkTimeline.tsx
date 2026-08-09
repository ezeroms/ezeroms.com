import Link from "next/link";
import type { Work } from "@/types/content";
import {
  formatWorkPeriod,
  workCategoryLabel,
  workPrimaryDate,
  workYear,
} from "@/lib/content/work-filter";
import { cn } from "@/lib/cn";
import { cardOutlineClass } from "@/lib/site/card-styles";

type Props = {
  items: Work[];
};

/**
 * Vertical involvement timeline: when / what / role / client.
 * Sorted by start_date (desc).
 */
export function WorkTimeline({ items }: Props) {
  const sorted = [...items].sort(
    (a, b) => workPrimaryDate(b).getTime() - workPrimaryDate(a).getTime(),
  );

  if (!sorted.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        タイムラインに表示する実績がありません。
      </p>
    );
  }

  let lastYear = "";

  return (
    <ol className="relative m-0 list-none border-l border-border p-0 pl-6">
      {sorted.map((item) => {
        const year = workYear(item);
        const showYear = year && year !== lastYear;
        if (year) lastYear = year;
        const period = formatWorkPeriod(item.start_date, item.end_date);
        const meta = [item.role, item.client, item.agency]
          .filter(Boolean)
          .join(" · ");
        const catLabel = item.work_category?.[0]
          ? workCategoryLabel(item.work_category[0])
          : null;

        return (
          <li key={item.id} className="relative pb-8 last:pb-0">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary",
              )}
            />

            {showYear ? (
              <p className="mb-2 mt-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {year}
              </p>
            ) : null}

            <div className={cn("rounded-xl bg-card p-6", cardOutlineClass)}>
              <Link
                href={`/works/creative/${item.slug}/`}
                className="block text-inherit no-underline"
              >
                {period ? (
                  <p className="m-0 mb-2 text-sm text-muted-foreground">
                    {period}
                  </p>
                ) : null}
                <h3 className="m-0 text-base font-semibold leading-snug text-foreground">
                  {item.title}
                </h3>
                {meta ? (
                  <p className="m-0 mt-2 text-sm leading-snug text-muted-foreground">
                    {meta}
                  </p>
                ) : null}
                {catLabel || (item.work_tag ?? []).length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {catLabel ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {catLabel}
                      </span>
                    ) : null}
                    {[...(item.work_tag ?? [])].sort().slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
