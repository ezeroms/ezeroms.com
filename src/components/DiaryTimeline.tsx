"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Diary } from "@/types/content";
import {
  diaryPermalink,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { DiaryShareButton } from "@/components/DiaryShareButton";
import { contentCard } from "@/lib/site/card-styles";

type Props = {
  items: Diary[];
  currentTag?: string;
  /** When set, scroll to this entry and highlight it (permalink / deep link). */
  focusSlug?: string;
  /** Skip empty-state copy (e.g. related block). */
  hideEmpty?: boolean;
  /** Avoid duplicate #notification when the page already has one. */
  showNotification?: boolean;
};

export function DiaryTimeline({
  items,
  currentTag,
  focusSlug,
  hideEmpty,
  showNotification = true,
}: Props) {
  const [activeFocus, setActiveFocus] = useState<string | undefined>(focusSlug);

  useEffect(() => {
    setActiveFocus(focusSlug);
  }, [focusSlug]);

  useEffect(() => {
    if (focusSlug) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    if (!items.some((i) => i.slug === hash)) return;
    setActiveFocus(hash);
  }, [focusSlug, items]);

  useEffect(() => {
    if (!activeFocus) return;
    const el = document.getElementById(activeFocus);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [activeFocus]);

  const hasFocus = Boolean(activeFocus);

  if (!items.length) {
    if (hideEmpty) return null;
    return (
      <div className="w-full font-sans" id="diary-list">
        <p className="py-10 text-sm text-muted-foreground">
          まだメモがありません。
        </p>
      </div>
    );
  }

  return (
    <>
      {showNotification ? (
        <div id="notification" className="notification">
          リンクをコピーしました
        </div>
      ) : null}

      <div className="w-full font-sans" id="diary-list">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {items.map((item) => {
            const isFocused = activeFocus === item.slug;
            const permalink = diaryPermalink(item.slug);
            const dateLabel = formatDiaryDate(item.date);
            return (
              <article
                key={item.id}
                id={item.slug}
                className={cn(
                  contentCard({ className: "group overflow-visible p-6" }),
                  hasFocus && !isFocused && "opacity-40",
                  isFocused && "ring-1 ring-[hsl(var(--foreground)/0.35)]",
                )}
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
                      <Link
                        href={permalink}
                        className="no-underline hover:underline"
                      >
                        <time dateTime={item.date}>{dateLabel}</time>
                      </Link>
                      {item.diary_place ? (
                        <>
                          <span aria-hidden>·</span>
                          <Link
                            href={`/diary_place/${encodeURIComponent(item.diary_place)}/`}
                            className="truncate no-underline hover:underline"
                          >
                            {item.diary_place}
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <DiaryShareButton
                    path={diaryPermalink(item.slug)}
                    className="-mr-1.5 -mt-1.5"
                  />
                </div>

                <div
                  className={notesBodyClass}
                  dangerouslySetInnerHTML={{ __html: item.body_html }}
                />

                {(item.diary_tag?.length ?? 0) > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[...(item.diary_tag ?? [])].sort().map((tag) => {
                      const active = currentTag === tag;
                      return (
                        <Link
                          key={tag}
                          href={`/diary_tag/${encodeURIComponent(tag)}/`}
                          className={tagChipClass(active)}
                          data-tag={tag}
                        >
                          {tag}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
