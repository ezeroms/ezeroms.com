"use client";

import Link from "next/link";
import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { cn } from "@/lib/cn";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import { GiantsTopicBottomSheet } from "@/components/GiantsTopicBottomSheet";

type Props = {
  topics: string[];
  selectedTopic?: string | null;
};

/**
 * Giants 一覧・詳細共通のトピックナビ。
 * PC（≥1080）: 左カラム縦リスト
 * スマホ／タブレット: 右下 FAB → ボトムシート
 */
export function GiantsTopicNav({ topics, selectedTopic = null }: Props) {
  const sorted = [...topics].sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <>
      <aside
        className={cn(
          "hidden w-full shrink-0",
          "min-[1080px]:flex min-[1080px]:h-full min-[1080px]:w-52 min-[1080px]:min-h-0 min-[1080px]:flex-col",
          "min-[1080px]:overflow-y-auto",
        )}
        aria-label="トピック一覧"
      >
        <ul
          className={cn(
            "m-0 flex list-none flex-col flex-nowrap gap-0.5 p-0",
          )}
        >
          <li className="min-w-0 w-full">
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
              <li key={topic} className="min-w-0 w-full">
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

      <GiantsTopicBottomSheet topics={topics} selectedTopic={selectedTopic} />
    </>
  );
}
