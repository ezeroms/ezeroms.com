import Link from "next/link";
import type { Clip } from "@/types/content";
import { ClipYoutubeEmbed } from "@/components/ClipYoutubeEmbed";
import {
  clipSourceHost,
  formatClipDate,
  parseYoutubeVideoId,
} from "@/lib/content/clip-meta";
import { serializeNotesFilter } from "@/lib/content/notes-filter";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";

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
        "columns-1 gap-6 sm:columns-2 xl:columns-3",
        "w-full",
      )}
    >
      {items.map((item) => {
        const host = clipSourceHost(item.source_url);
        const youtubeId = parseYoutubeVideoId(item.source_url);
        const hasImage = Boolean(item.og_image?.trim());

        return (
          <article
            key={item.id}
            className={cn(
              "mb-6 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card shadow-sm",
            )}
          >
            {youtubeId ? (
              <ClipYoutubeEmbed videoId={youtubeId} title={item.title} />
            ) : hasImage ? (
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

            <div className="flex flex-col gap-3 p-6">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                <time dateTime={item.date}>{formatClipDate(item.date)}</time>
                <span aria-hidden>·</span>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate underline-offset-2 hover:text-foreground hover:underline"
                >
                  {youtubeId ? "YouTube" : host}
                </a>
              </div>

              <h2 className="m-0 text-base font-semibold leading-snug tracking-tight">
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
                <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                  {item.memo.trim()}
                </p>
              ) : null}

              {(item.clip_tag ?? []).length ? (
                <div className="mt-1 flex flex-wrap gap-2">
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
                        className={tagChipClass(active)}
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
