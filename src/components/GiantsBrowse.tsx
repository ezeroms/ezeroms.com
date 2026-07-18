"use client";

import Link from "next/link";
import type { ShouldersOfGiants } from "@/types/content";
import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { cn } from "@/lib/cn";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";

type Props = {
  topics: string[];
  items: ShouldersOfGiants[];
  /** 単一選択。空なら全件（シャッフル済み）表示 */
  selectedTopic?: string | null;
};

/**
 * 左: 50音順トピックナビ
 * 右: Notes と同型の引用カード
 */
export function GiantsBrowse({
  topics,
  items,
  selectedTopic = null,
}: Props) {
  return (
    <>
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-8">
        <GiantsTopicNav topics={topics} selectedTopic={selectedTopic} />

        <div className="min-w-0 flex-1 font-sans" id="giants-list">
          {!items.length ? (
            <p className="py-10 text-sm text-muted-foreground">
              {selectedTopic
                ? "このトピックのメモはまだありません。"
                : "まだメモがありません。"}
            </p>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {items.map((item) => (
                <GiantsQuoteCard
                  key={item.id}
                  item={item}
                  selectedTopic={selectedTopic}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function GiantsTopicNav({
  topics,
  selectedTopic,
}: {
  topics: string[];
  selectedTopic?: string | null;
}) {
  const sorted = [...topics].sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <aside
      className={cn(
        "w-full shrink-0 lg:sticky lg:top-0 lg:w-52 lg:self-start",
        "lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto",
      )}
      aria-label="トピック一覧"
    >
      <ul className="m-0 flex list-none flex-wrap gap-1 p-0 lg:flex-col lg:flex-nowrap lg:gap-0.5">
        <li className="min-w-0 lg:w-full">
          <Link
            href="/shoulders-of-giants/"
            className={cn(sidebarNavItemClass(!selectedTopic), "text-sm")}
          >
            すべて
          </Link>
        </li>
        {sorted.map((topic) => {
          const active = selectedTopic === topic;
          return (
            <li key={topic} className="min-w-0 lg:w-full">
              <Link
                href={`/shoulders-of-giants/${serializeGiantsFilter({
                  topics: [topic],
                })}`}
                className={cn(
                  sidebarNavItemClass(active),
                  "truncate text-sm leading-snug",
                )}
              >
                {topic}
              </Link>
            </li>
          );
        })}
        {!sorted.length ? (
          <li className="px-2 py-1.5 text-xs text-muted-foreground">
            トピックがありません
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
