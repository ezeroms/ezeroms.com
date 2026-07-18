"use client";

import { useEffect, useState } from "react";
import type { ShouldersOfGiants } from "@/types/content";
import { cn } from "@/lib/cn";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";

type Props = {
  items: ShouldersOfGiants[];
  /** Currently active topic filters (for tag highlight). */
  activeTopics?: string[];
  focusSlug?: string;
};

export function GiantsTimeline({
  items,
  activeTopics = [],
  focusSlug,
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

  return (
    <>
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div className="w-full font-sans" id="giants-list">
        {!items.length ? (
          <p className="py-10 text-sm text-muted-foreground">
            条件に合うメモがありません。
          </p>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2">
            {items.map((item) => {
              const isFocused = activeFocus === item.slug;
              return (
                <GiantsQuoteCard
                  key={item.id}
                  item={item}
                  activeTopics={activeTopics}
                  className="mb-6 break-inside-avoid"
                  articleClassName={cn(
                    hasFocus && !isFocused && "opacity-40",
                    isFocused && "ring-1 ring-[hsl(var(--foreground)/0.35)]",
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
