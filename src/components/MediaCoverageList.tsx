import Link from "next/link";
import type { MediaCoverage } from "@/types/content";
import { cn } from "@/lib/cn";

type Props = {
  items: MediaCoverage[];
};

function formatDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MediaCoverageList({ items }: Props) {
  if (!items.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        まだ掲載がありません。
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2">
      {items.map((item) => {
        const dateLabel = formatDate(item.date);
        const external = Boolean(item.external_url?.trim());
        const href = external
          ? item.external_url!
          : `/about/media-coverage/${item.slug}/`;

        const body = (
          <div className="flex flex-col gap-2 p-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              {dateLabel ? <time dateTime={item.date ?? undefined}>{dateLabel}</time> : null}
              {dateLabel && item.lead ? <span aria-hidden>·</span> : null}
              {item.lead ? <span>{item.lead}</span> : null}
            </div>
            <h2 className="m-0 text-base font-semibold leading-snug tracking-tight text-foreground">
              {item.title}
            </h2>
            {external ? (
              <p className="m-0 text-[12px] text-muted-foreground">
                外部記事を見る →
              </p>
            ) : null}
          </div>
        );

        return (
          <article
            key={item.id}
            className={cn(
              "mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card",
              "shadow-sm transition-shadow hover:shadow-md",
            )}
          >
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-inherit no-underline"
              >
                {body}
              </a>
            ) : (
              <Link href={href} className="block text-inherit no-underline">
                {body}
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
