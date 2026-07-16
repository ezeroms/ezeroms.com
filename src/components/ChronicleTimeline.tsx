import Link from "next/link";
import type { Chronicle } from "@/types/content";
import {
  chronicleYear,
  formatChronicleDate,
  serializeChronicleFilter,
} from "@/lib/content/chronicle-filter";
import { cn } from "@/lib/cn";

type Props = {
  items: Chronicle[];
};

/** Vertical chronicle timeline grouped by year. */
export function ChronicleTimeline({ items }: Props) {
  const sorted = [...items].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (Number.isNaN(da) || Number.isNaN(db)) {
      return b.date.localeCompare(a.date);
    }
    return db - da;
  });

  if (!sorted.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        条件に合う出来事がありません。
      </p>
    );
  }

  let lastYear = "";

  return (
    <ol className="relative m-0 list-none border-l border-border p-0 pl-6">
      {sorted.map((item) => {
        const year = chronicleYear(item.date);
        const showYear = year && year !== lastYear;
        if (year) lastYear = year;
        const meta = [item.category, item.subcategory]
          .filter(Boolean)
          .join(" · ");

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

            <article className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md">
              <p className="m-0 mb-1 text-[11px] text-muted-foreground">
                {formatChronicleDate(item.date)}
                {meta ? ` · ${meta}` : ""}
              </p>
              <h3 className="m-0 text-[15px] font-semibold leading-snug text-foreground">
                <Link
                  href={`/chronicle/${item.slug}/`}
                  className="text-inherit no-underline hover:underline hover:underline-offset-2"
                >
                  {item.title}
                </Link>
              </h3>
              {item.description ? (
                <p className="m-0 mt-1.5 text-[13px] leading-snug text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              {(item.chronicle_tag ?? []).length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(item.chronicle_tag ?? [])].sort().map((tag) => (
                    <Link
                      key={tag}
                      href={`/chronicle/${serializeChronicleFilter({
                        interests: [],
                        years: [],
                        tags: [tag],
                      })}`}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground no-underline hover:bg-accent hover:text-foreground"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
