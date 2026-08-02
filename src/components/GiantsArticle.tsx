"use client";

import type { ShouldersOfGiants } from "@/types/content";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";
import { GiantsTopicNav } from "@/components/GiantsTopicNav";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";
import { cn } from "@/lib/cn";

type Props = {
  item: ShouldersOfGiants;
  /** Already sanitized body HTML */
  bodyHtml: string;
  topics: string[];
  related?: ShouldersOfGiants[];
};

/**
 * The shoulders of Giants の個別詳細。
 * 一覧と同じく左トピックナビ + 右コンテンツ。
 */
export function GiantsArticle({
  item,
  bodyHtml,
  topics,
  related = [],
}: Props) {
  return (
    <>
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div
        className={cn(
          "flex w-full flex-col gap-6",
          "min-[1080px]:min-h-0 min-[1080px]:flex-1 min-[1080px]:flex-row min-[1080px]:gap-8 min-[1080px]:overflow-hidden",
        )}
      >
        <GiantsTopicNav topics={topics} />

        <div
          className={cn(
            "min-w-0 flex-1 font-sans text-foreground",
            "min-[1080px]:min-h-0 min-[1080px]:overflow-y-auto",
          )}
        >
          <div className="mx-auto w-full max-w-3xl min-[1080px]:pb-6">
            <GiantsQuoteCard
              item={item}
              bodyHtml={bodyHtml}
              className="w-full"
            />

            {related.length > 0 ? (
              <RelatedPostsSection>
                <div className="flex flex-col gap-6">
                  {related.map((entry) => (
                    <GiantsQuoteCard key={entry.id} item={entry} />
                  ))}
                </div>
              </RelatedPostsSection>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
