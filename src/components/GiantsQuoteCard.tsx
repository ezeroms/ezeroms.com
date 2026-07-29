"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ShouldersOfGiants } from "@/types/content";
import {
  formatGiantsCitation,
  giantsPermalink,
} from "@/lib/content/giants-meta";
import { serializeGiantsFilter } from "@/lib/content/giants-filter";
import { cn } from "@/lib/cn";
import { contentCard } from "@/lib/site/card-styles";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { tagChipClass } from "@/lib/site/tag-styles";
import { ShareButton } from "@/components/ShareButton";

type Props = {
  item: ShouldersOfGiants;
  /** Already sanitized body when provided (detail); otherwise raw body_html. */
  bodyHtml?: string;
  selectedTopic?: string | null;
  activeTopics?: string[];
  className?: string;
  articleClassName?: string;
};

/**
 * Giants quote card — Notes list chrome (surface, body, tags) + share after tags.
 * 書誌行は購入リンク（source_url）があるときだけ外部リンク（別タブ）。
 */
export function GiantsQuoteCard({
  item,
  bodyHtml,
  selectedTopic = null,
  activeTopics = [],
  className,
  articleClassName,
}: Props) {
  const permalink = giantsPermalink(item.slug);
  const citation = formatGiantsCitation(item);
  const purchaseUrl = item.source_url?.trim() || "";
  const topics = [...(item.topic ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  const html = bodyHtml ?? item.body_html;

  let citationNode: ReactNode = null;
  if (citation) {
    if (purchaseUrl) {
      citationNode = (
        <a
          href={purchaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit underline underline-offset-2 decoration-foreground/35 transition-colors hover:decoration-foreground"
        >
          {citation}
        </a>
      );
    } else {
      citationNode = citation;
    }
  }

  return (
    <article
      id={item.slug}
      data-permalink={permalink}
      className={contentCard({
        className: cn(
          "overflow-visible p-6",
          className,
          articleClassName,
        ),
      })}
    >
      <div
        className={notesBodyClass}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {citationNode ? (
        <p className="m-0 mt-4 text-base leading-[1.8] text-foreground">
          {citationNode}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {topics.map((topic) => {
          const active =
            selectedTopic === topic || activeTopics.includes(topic);
          return (
            <Link
              key={topic}
              href={`/shoulders-of-giants/${serializeGiantsFilter({
                topics: [topic],
              })}`}
              className={tagChipClass(active)}
            >
              {topic}
            </Link>
          );
        })}
        <ShareButton path={permalink} />
      </div>
    </article>
  );
}
