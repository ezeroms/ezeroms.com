import Link from "next/link";
import type { Clip } from "@/types/content";
import { clipSourceHost, formatClipDate } from "@/lib/content/clip-meta";
import { serializeNotesFilter } from "@/lib/content/notes-filter";
import { cn } from "@/lib/cn";

type Props = {
  items: Clip[];
  activeTags?: string[];
};

export function ClipsMasonry({ items, activeTags = [] }: Props) {
  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        条件に合うクリップがありません。
      </p>
    );
  }

  return (
    <div
      className={cn(
        /* With right rail, prefer 2–3 cols so cards stay readable */
        "columns-1 gap-4 sm:columns-2 xl:columns-3",
        "w-full",
      )}
    >
      {items.map((item) => {
        const host = clipSourceHost(item.source_url);
        const hasImage = Boolean(item.og_image?.trim());
        return (
          <article
            key={item.id}
            className={cn(
              "mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card",
              "shadow-sm transition-shadow hover:shadow-md",
            )}
          >
            {hasImage ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden bg-muted"
                aria-label={`${item.title} のプレビュー`}
              >
                {/* External OGP — arbitrary domains; avoid next/image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.og_image}
                  alt=""
                  className="m-0 block h-auto w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : null}

            <div className="flex flex-col gap-2 p-3.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <time dateTime={item.date}>{formatClipDate(item.date)}</time>
                <span aria-hidden>·</span>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate underline-offset-2 hover:text-foreground hover:underline"
                >
                  {host}
                </a>
              </div>

              <h2 className="m-0 text-[15px] font-semibold leading-snug tracking-tight">
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground no-underline hover:underline hover:underline-offset-2"
                >
                  {item.title}
                </a>
              </h2>

              {item.memo?.trim() ? (
                <p className="m-0 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
                  {item.memo.trim()}
                </p>
              ) : null}

              {(item.clip_tag ?? []).length ? (
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  {[...item.clip_tag].sort().map((tag) => {
                    const active = activeTags.includes(tag);
                    const href = `/clips/${serializeNotesFilter({
                      months: [],
                      weekdays: [],
                      tags: [tag],
                      places: [],
                    })}`;
                    return (
                      <Link
                        key={tag}
                        href={href}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium no-underline transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        {tag}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
