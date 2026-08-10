"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Tags, X } from "lucide-react";
import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { cn } from "@/lib/cn";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";

type Props = {
  topics: string[];
  selectedTopic?: string | null;
};

/**
 * スマホ／タブレット向けトピック選択。
 * 右下 FAB → ボトムシートで縦リスト（どちらも portal）。
 */
export function GiantsTopicBottomSheet({
  topics,
  selectedTopic = null,
}: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sorted = [...topics].sort((a, b) => a.localeCompare(b, "ja"));
  const filtered = Boolean(selectedTopic);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // トピック切替で URL が変わったら閉じる
  useEffect(() => {
    setOpen(false);
  }, [selectedTopic]);

  if (!mounted) return null;

  return createPortal(
    <div className="min-[1080px]:hidden">
      <button
        type="button"
        className={cn(
          "fixed z-[60] inline-flex h-12 w-12 items-center justify-center",
          "appearance-none rounded-full border border-solid border-border bg-card",
          "text-foreground shadow-none outline-none transition-colors",
          "hover:border-border-hover hover:bg-card",
          "focus-visible:ring-2 focus-visible:ring-border-hover focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "right-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))]",
        )}
        aria-label={
          filtered ? `トピックを選ぶ（${selectedTopic}）` : "トピックを選ぶ"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Tags className="h-5 w-5" aria-hidden />
        {filtered ? (
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-foreground"
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          role="presentation"
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 m-0 cursor-default border-0 p-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative z-10 flex w-full max-h-[80vh] flex-col",
              "rounded-t-2xl border border-b-0 border-border bg-background",
              "pb-[env(safe-area-inset-bottom)]",
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2
                id={titleId}
                className="m-0 text-sm font-semibold tracking-wide text-foreground"
              >
                トピック
              </h2>
              <button
                type="button"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent",
                  "appearance-none text-muted-foreground shadow-none hover:bg-accent hover:text-foreground",
                )}
                aria-label="閉じる"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <nav
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
              aria-label="トピック一覧"
            >
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                <li>
                  <Link
                    href="/shoulders-of-giants/"
                    className={cn(sidebarNavItemClass(!selectedTopic), "text-sm")}
                    onClick={() => setOpen(false)}
                  >
                    すべて
                  </Link>
                </li>
                {sorted.map((topic) => {
                  const active = selectedTopic === topic;
                  return (
                    <li key={topic}>
                      <Link
                        href={`/shoulders-of-giants/${serializeGiantsFilter({
                          topics: [topic],
                        })}`}
                        className={cn(
                          sidebarNavItemClass(active),
                          "text-sm leading-snug",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {topic}
                      </Link>
                    </li>
                  );
                })}
                {!sorted.length ? (
                  <li className="px-2 py-3 text-xs text-muted-foreground">
                    トピックがありません
                  </li>
                ) : null}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
