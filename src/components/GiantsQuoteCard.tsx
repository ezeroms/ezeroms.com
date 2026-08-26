"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ShouldersOfGiants } from "@/types/content";
import {
  formatGiantsCitation,
  giantsPermalink,
} from "@/lib/content/giants-meta";
import { giantsTagHref } from "@/lib/content/giants-filter";
import { cn } from "@/lib/cn";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { tagPillClass } from "@/lib/site/tag-styles";
import { ArticleProse } from "@/components/ArticleProse";
import { ShareButton } from "@/components/ShareButton";

type Props = {
  item: ShouldersOfGiants;
  /** Already sanitized body when provided (detail); otherwise raw body_html. */
  bodyHtml?: string;
  selectedTag?: string | null;
  activeTags?: string[];
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
 * Giants の引用。Diary と同じ枠なし紙面。
 */
export function GiantsQuoteCard({
  item,
  bodyHtml,
  selectedTag = null,
  activeTags = [],
  className,
  articleClassName,
}: Props) {
  const permalink = giantsPermalink(item.slug);
  const citation = formatGiantsCitation(item);
  const purchaseUrl = item.source_url?.trim() || "";
  const tags = [...(item.giants_tag ?? [])].sort((a, b) =>
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
      className={cn("overflow-visible", className, articleClassName)}
    >
      <ArticleProse className={notesBodyClass} html={html} />

      {citationNode ? (
        <p className="m-0 mt-4 text-[0.9375rem] leading-[1.8] text-foreground min-[1080px]:text-base">
          {citationNode}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const active =
            selectedTag === tag || activeTags.includes(tag);
          return (
            <Link
              key={tag}
              href={giantsTagHref(tag)}
              className={tagPillClass(active)}
            >
              {tag}
            </Link>
          );
        })}
        <ShareButton path={permalink} />
      </div>
    </article>
  );
}
