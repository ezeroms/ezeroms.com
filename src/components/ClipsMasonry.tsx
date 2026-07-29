"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import type { Clip } from "@/types/content";
import {
  clipSourceLabel,
  formatClipDate,
  parseYoutubeVideoId,
} from "@/lib/content/clip-meta";
import { serializeNotesFilter, emptyNotesFilter } from "@/lib/content/notes-filter";
import { cn } from "@/lib/cn";
import { contentCard } from "@/lib/site/card-styles";
import { tagChipClass } from "@/lib/site/tag-styles";

type Props = {
  items: Clip[];
  activeTags?: string[];
  /** クリップ og 未設定・YouTube 以外のときのフォールバック（カテゴリ OGP） */
  fallbackThumbSrc?: string | null;
};

/** Shell-aligned columns: phone 1 / tablet 2 / desktop 3 */
function clipsColumnCount(): number {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1080px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

/** 新しい順の配列を、左→右に振り分けて各列へ積む（Photos と同じ） */
function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  for (let i = 0; i < items.length; i++) {
    columns[i % columnCount].push(items[i]!);
  }
  return columns;
}

function clipPreviewSrc(
  item: Clip,
  youtubeId: string | null,
  fallbackThumbSrc?: string | null,
): string | null {
  if (youtubeId) return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  const og = item.og_image?.trim();
  if (og) return og;
  const fallback = fallbackThumbSrc?.trim();
  return fallback || null;
}

function ClipCard({
  item,
  activeTags,
  fallbackThumbSrc,
}: {
  item: Clip;
  activeTags: string[];
  fallbackThumbSrc?: string | null;
}) {
  const sourceLabel = clipSourceLabel(item.source_url, item.source_name);
  const youtubeId = parseYoutubeVideoId(item.source_url);
  const previewSrc = clipPreviewSrc(item, youtubeId, fallbackThumbSrc);
  const tags = [...(item.clip_tag ?? [])].sort();

  return (
    <article
      className={contentCard({
        link: true,
        className: "group relative",
      })}
    >
      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-0"
        aria-label={item.title}
      />

      <div className="relative z-[1] pointer-events-none">
        {previewSrc ? (
          <div className="overflow-hidden bg-muted">
            {/* External OGP / YouTube thumb — arbitrary domains; avoid next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt=""
              className="m-0 block h-auto w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            <time dateTime={item.date}>{formatClipDate(item.date)}</time>
            <span aria-hidden>·</span>
            {/* 出典だけカードリンクの外に出す（クリックしても遷移しない） */}
            <span className="pointer-events-auto relative z-[1] truncate">
              {sourceLabel}
            </span>
          </div>

          <h2 className="m-0 text-base font-semibold leading-snug tracking-tight text-foreground">
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto relative z-[1] text-inherit no-underline hover:underline hover:underline-offset-2"
            >
              {item.title}
            </a>
          </h2>

          {tags.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const href = `/clips/${serializeNotesFilter({
                  ...emptyNotesFilter(),
                  tags: [tag],
                })}`;
                return (
                  <Link
                    key={tag}
                    href={href}
                    className={cn(
                      "pointer-events-auto relative z-[1]",
                      tagChipClass(activeTags.includes(tag)),
                    )}
                  >
                    {tag}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {item.memo?.trim() ? (
            <div
              className="mt-2 flex gap-2.5 rounded-md border border-solid bg-white px-3 py-2.5"
              style={{ borderColor: "var(--color-border-light, #d0d0d1)" }}
            >
              <PenLine
                className="mt-1 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <p className="m-0 min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                <span className="sr-only">メモ: </span>
                {item.memo.trim()}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Clips 一覧。新しいものから左→右に振り分け、各列で上に詰める（Photos と同じ）。
 */
export function ClipsMasonry({
  items,
  activeTags = [],
  fallbackThumbSrc = null,
}: Props) {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    function updateColumns() {
      setColumnCount(clipsColumnCount());
    }
    updateColumns();
    const mqTablet = window.matchMedia("(min-width: 768px)");
    const mqDesktop = window.matchMedia("(min-width: 1080px)");
    mqTablet.addEventListener("change", updateColumns);
    mqDesktop.addEventListener("change", updateColumns);
    return () => {
      mqTablet.removeEventListener("change", updateColumns);
      mqDesktop.removeEventListener("change", updateColumns);
    };
  }, []);

  const columns = useMemo(
    () => splitIntoColumns(items, columnCount),
    [items, columnCount],
  );

  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        条件に合うクリップがありません。
      </p>
    );
  }

  return (
    <div
      className="flex w-full items-start gap-6"
      role="list"
      aria-label="クリップ一覧"
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-1 flex-col gap-6"
        >
          {column.map((item) => (
            <div key={item.id} role="listitem">
              <ClipCard
                item={item}
                activeTags={activeTags}
                fallbackThumbSrc={fallbackThumbSrc}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
