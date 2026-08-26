"use client";

import type { ShouldersOfGiants } from "@/types/content";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";

type Props = {
  item: ShouldersOfGiants;
  /** Already sanitized body HTML */
  bodyHtml: string;
  related?: ShouldersOfGiants[];
};

/**
 * The shoulders of Giants の個別詳細。一覧と同じ枠なし紙面。
 */
export function GiantsArticle({
  item,
  bodyHtml,
  related = [],
}: Props) {
  return (
    <>
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div className="w-full font-sans text-foreground">
        <div className="mx-auto w-full max-w-2xl">
          <GiantsQuoteCard
            item={item}
            bodyHtml={bodyHtml}
            className="py-4"
          />

          {related.length > 0 ? (
            <RelatedPostsSection className="max-w-2xl">
              <div className="flex flex-col">
                {related.map((entry, index) => (
                  <div key={entry.id}>
                    {index > 0 ? (
                      <div className="h-px bg-border-subtle" aria-hidden />
                    ) : null}
                    <GiantsQuoteCard item={entry} className="py-8" />
                  </div>
                ))}
              </div>
            </RelatedPostsSection>
          ) : null}
        </div>
      </div>
    </>
  );
}
