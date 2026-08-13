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

/** 購入リンク付き書名: 通常は本文色、hover で下線＋薄いリンク色（本文リンクと同系） */
const bookTitleLinkClass =
  "text-inherit no-underline transition-colors hover:!text-muted-foreground hover:!underline hover:underline-offset-2";

function citationWithBookLink(
  citation: string,
  purchaseUrl: string,
  bookTitle: string | null | undefined,
): ReactNode {
  const linked = (label: string) => (
    <a
      href={purchaseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={bookTitleLinkClass}
    >
      {label}
    </a>
  );

  const title = bookTitle?.trim();
  if (title) {
    const book = `『${title}』`;
    const idx = citation.indexOf(book);
    if (idx !== -1) {
      return (
        <>
          {citation.slice(0, idx)}
          {linked(book)}
          {citation.slice(idx + book.length)}
        </>
      );
    }
  }

  // 書誌上書きなどで『書名』が取れないときは『…』を優先、なければ全文
  const bracket = citation.match(/『[^』]+』/);
  if (bracket?.index != null) {
    const { 0: book, index } = bracket;
    return (
      <>
        {citation.slice(0, index)}
        {linked(book)}
        {citation.slice(index + book.length)}
      </>
    );
  }

  return linked(citation);
}

/**
 * Giants quote card — Notes list chrome (surface, body, tags) + share after tags.
 * 書誌行は購入リンク（source_url）があるとき、書名部分だけ外部リンク（別タブ）。
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
    citationNode = purchaseUrl
      ? citationWithBookLink(citation, purchaseUrl, item.book_title)
      : citation;
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
        <p className="m-0 mt-4 text-[0.9375rem] leading-[1.8] text-foreground min-[1080px]:text-base">
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
