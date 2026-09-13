"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Diary } from "@/types/content";
import {
  diaryPermalink,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import { cn } from "@/lib/cn";
import { tagPillClass } from "@/lib/site/tag-styles";
import { articleBodyClass } from "@/lib/site/prose-styles";
import { ArticleProse } from "@/components/ArticleProse";
import { ShareButton } from "@/components/ShareButton";

type Props = {
  items: Diary[];
  currentTag?: string;
  /** 指定時、その投稿へスクロールしてハイライト（パーマリンク / ディープリンク） */
  focusSlug?: string;
  /** 関連投稿など、空のときの文言を出さない場合 */
  hideEmpty?: boolean;
  /** ページ側に #notification があるとき二重に出さない */
  showNotification?: boolean;
};

/**
 * Diary 一覧のタイムライン。
 * DB / URL は diary のままなので、DOM id も互換のため diary-list を維持する。
 */
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

  // ハッシュ付き URL（#slug）で来たときもフォーカス対象にする
  useEffect(() => {
    if (focusSlug) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    if (!items.some((item) => item.slug === hash)) return;
    setActiveFocus(hash);
  }, [focusSlug, items]);

  useEffect(() => {
    if (!activeFocus) return;
    const el = document.getElementById(activeFocus);
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
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
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {items.map((item, index) => {
            const isFocused = activeFocus === item.slug;
            const permalink = diaryPermalink(item.slug);
            const dateLabel = formatDiaryDate(item.date);
            return (
              <div key={item.id}>
                {index > 0 ? (
                  <div className="h-px bg-border-subtle" aria-hidden />
                ) : null}
                <article
                  id={item.slug}
                  className={cn(
                    "overflow-visible py-8",
                    hasFocus && !isFocused && "opacity-40",
                  )}
                >
                  <div className="mb-4">
                    <h2 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground min-[768px]:text-3xl">
                      <Link
                        href={permalink}
                        className="text-inherit no-underline hover:underline hover:underline-offset-4"
                      >
                        <time dateTime={item.date}>{dateLabel}</time>
                      </Link>
                    </h2>
                    {item.diary_place ? (
                      <p className="m-0 mt-1.5 text-sm leading-tight text-muted-foreground">
                        <Link
                          href={`/diary_place/${encodeURIComponent(item.diary_place)}/`}
                          className="truncate no-underline hover:underline"
                        >
                          {item.diary_place}
                        </Link>
                      </p>
                    ) : null}
                  </div>

                  <ArticleProse
                    className={articleBodyClass}
                    html={item.body_html}
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {[...(item.diary_tag ?? [])].sort().map((tag) => {
                      const active = currentTag === tag;
                      return (
                        <Link
                          key={tag}
                          href={`/diary_tag/${encodeURIComponent(tag)}/`}
                          className={tagPillClass(active)}
                          data-tag={tag}
                        >
                          {tag}
                        </Link>
                      );
                    })}
                    <ShareButton path={permalink} />
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
