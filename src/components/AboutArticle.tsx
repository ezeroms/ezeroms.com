import { ArticleProse } from "@/components/ArticleProse";
import { cn } from "@/lib/cn";
import type { AboutHereCard } from "@/lib/content/about-here";
import { notesBodyClass } from "@/lib/site/prose-styles";

type Props = {
  /** Already sanitized body HTML */
  bodyHtml: string;
  title?: string;
  /** Cover at the top of the page (Me fallback) */
  coverSrc?: string | null;
};

const proseClassName = cn(
  notesBodyClass,
  "[&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-snug [&_h1]:tracking-tight sm:[&_h1]:text-3xl",
  "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h2:first-child]:mt-0",
  "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight",
  "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-sm",
  "[&_figure]:my-6",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground",
  "[&_strong]:font-semibold",
);

/**
 * About（Me / Here / Contact）本文。
 * Column 詳細と同じ枠なし紙面。
 */
export function AboutArticle({
  bodyHtml,
  title,
  coverSrc,
}: Props) {
  return (
    <div className="w-full font-sans text-foreground">
      <article className="mx-auto min-w-0 w-full max-w-2xl overflow-visible py-4">
        {coverSrc ? (
          <div className="mb-6 overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt=""
              className="m-0 block h-auto w-full object-cover"
            />
          </div>
        ) : null}

        {title ? (
          <>
            <h1 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground min-[768px]:text-3xl">
              {title}
            </h1>
            <div className="my-6 h-px w-full bg-border" aria-hidden />
          </>
        ) : null}

        <ArticleProse html={bodyHtml} className={proseClassName} />
      </article>
    </div>
  );
}

export function AboutHereArticles({
  cards,
  pageTitle,
}: {
  cards: AboutHereCard[];
  pageTitle?: string;
}) {
  return (
    <div className="w-full font-sans text-foreground">
      <article className="mx-auto min-w-0 w-full max-w-2xl overflow-visible py-4">
        {pageTitle ? <h1 className="sr-only">{pageTitle}</h1> : null}
        {cards.map((card, index) => (
          <div key={card.key}>
            {index > 0 ? (
              <div className="my-8 h-px w-full bg-border-subtle" aria-hidden />
            ) : null}
            <ArticleProse html={card.html} className={proseClassName} />
          </div>
        ))}
      </article>
    </div>
  );
}
