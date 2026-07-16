"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Diary } from "@/types/content";
import { diaryPermalink } from "@/lib/content/diary-meta";
import { cn } from "@/lib/cn";

type Props = {
  items: Diary[];
  currentTag?: string;
  /** When set, scroll to this entry and highlight it (permalink / deep link). */
  focusSlug?: string;
};

function formatFeedTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" as const }),
  });
}

function formatAbsolute(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DiaryTimeline({ items, currentTag, focusSlug }: Props) {
  const [activeFocus, setActiveFocus] = useState<string | undefined>(focusSlug);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

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

  function copyLink(slug: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}${diaryPermalink(slug)}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      window.setTimeout(() => setCopiedSlug(null), 2000);
      const el = document.getElementById("notification");
      if (!el) return;
      el.className = "notification show";
      setTimeout(() => {
        el.className = "notification";
      }, 3000);
    });
  }

  const hasFocus = Boolean(activeFocus);

  return (
    <>
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div className="w-full font-sans" id="diary-list">
        {!items.length ? (
          <p className="py-10 text-sm text-muted-foreground">
            まだメモがありません。
          </p>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2">
            {items.map((item) => {
              const isFocused = activeFocus === item.slug;
              const permalink = diaryPermalink(item.slug);
              return (
                <article
                  key={item.id}
                  id={item.slug}
                  data-permalink={permalink}
                  className={cn(
                    "mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card",
                    "p-3.5 shadow-sm transition-shadow hover:shadow-md",
                    hasFocus && !isFocused && "opacity-40",
                    isFocused && "border-primary/40 ring-1 ring-primary/30",
                  )}
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <Link
                      href="/about/me/"
                      className="shrink-0"
                      aria-label="プロフィール"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/about/profile.webp"
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] leading-tight">
                        <Link
                          href="/about/me/"
                          className="font-semibold text-foreground no-underline hover:underline"
                        >
                          ezeroms
                        </Link>
                        <Link
                          href={permalink}
                          className="text-muted-foreground no-underline hover:underline"
                          title={formatAbsolute(item.date)}
                        >
                          {formatFeedTime(item.date)}
                        </Link>
                        {item.diary_place ? (
                          <>
                            <span className="text-muted-foreground" aria-hidden>
                              ·
                            </span>
                            <Link
                              href={`/diary_place/${encodeURIComponent(item.diary_place)}/`}
                              className="truncate text-muted-foreground no-underline hover:underline"
                            >
                              {item.diary_place}
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "notes-feed__body min-w-0 overflow-hidden text-[14px] leading-relaxed text-foreground",
                      "[&_a]:underline [&_a]:underline-offset-2",
                      "[&_img]:mt-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
                      "[&_p]:m-0 [&_p+p]:mt-2.5",
                      "[&_hr]:my-6 [&_hr]:h-0 [&_hr]:border-0 [&_hr]:bg-transparent",
                    )}
                    dangerouslySetInnerHTML={{ __html: item.body_html }}
                  />

                  {(item.diary_tag?.length ?? 0) > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[...(item.diary_tag ?? [])].sort().map((tag) => {
                        const active = currentTag === tag;
                        return (
                          <Link
                            key={tag}
                            href={`/diary_tag/${encodeURIComponent(tag)}/`}
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] font-medium no-underline transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )}
                            data-tag={tag}
                          >
                            {tag}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex items-center">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border-0 bg-transparent",
                        "px-1.5 py-1 text-xs text-muted-foreground transition-colors",
                        "hover:bg-accent hover:text-foreground",
                      )}
                      onClick={(e) => copyLink(item.slug, e)}
                      aria-label="リンクをコピー"
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                      <span>
                        {copiedSlug === item.slug ? "コピーしました" : "コピー"}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
