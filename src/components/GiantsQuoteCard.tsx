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
import { DiaryShareButton } from "@/components/DiaryShareButton";

type Props = {
  item: ShouldersOfGiants;
  /** Already sanitized body when provided (detail); otherwise raw body_html. */
  bodyHtml?: string;
  selectedTopic?: string | null;
  activeTopics?: string[];
  /** When no source_url, link citation to the Giants detail page (list cards). */
  linkCitationToDetail?: boolean;
  className?: string;
  articleClassName?: string;
};

/**
 * Giants quote card — Notes list chrome (surface, body, tags) + share at bottom-right.
 */
export function GiantsQuoteCard({
  item,
  bodyHtml,
  selectedTopic = null,
  activeTopics = [],
  linkCitationToDetail = true,
  className,
  articleClassName,
}: Props) {
  const permalink = giantsPermalink(item.slug);
  const citation = formatGiantsCitation(item);
  const sourceUrl = item.source_url?.trim() || "";
  const topics = [...(item.topic ?? [])].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  const html = bodyHtml ?? item.body_html;

  let citationNode: ReactNode = null;
  if (citation) {
    if (sourceUrl) {
      citationNode = (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit no-underline hover:underline hover:underline-offset-2"
        >
          {citation}
        </a>
      );
    } else if (linkCitationToDetail) {
      citationNode = (
        <Link
          href={permalink}
          className="text-inherit no-underline hover:underline hover:underline-offset-2"
        >
          {citation}
        </Link>
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
          "group overflow-visible p-6",
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
        <p className="m-0 mt-4 text-base leading-relaxed text-foreground">
          {citationNode}
        </p>
      ) : null}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
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
        </div>
        <DiaryShareButton
          path={permalink}
          className="-mb-1.5 -mr-1.5 shrink-0"
        />
      </div>
    </article>
  );
}
