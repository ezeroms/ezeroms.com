import { ArticleProse } from "@/components/ArticleProse";
import { cn } from "@/lib/cn";
import { notesBodyClass } from "@/lib/site/prose-styles";
import { contentCard } from "@/lib/site/card-styles";

type Props = {
  /** Already sanitized body HTML */
  bodyHtml: string;
  title?: string;
  /** Full-bleed cover at the top of the card (Me) */
  coverSrc?: string | null;
};

/**
 * About（Me / Here / Contact）本文。
 * Column 詳細と同じ読み物カード・区切り（hr は余白のみ）に揃える。
 */
export function AboutArticle({ bodyHtml, title, coverSrc }: Props) {
  return (
    <div className="w-full font-sans text-foreground">
      <article
        className={contentCard({
          className: "mx-auto min-w-0 w-full max-w-3xl overflow-hidden",
        })}
      >
        {coverSrc ? (
          <div className="bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt=""
              className="m-0 block h-auto w-full object-cover"
            />
          </div>
        ) : null}

        <div className="px-6 py-6 sm:p-8">
          {title ? (
            <>
              <h1 className="m-0 text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <div className="my-6 h-px w-full bg-border" aria-hidden />
            </>
          ) : null}

          <ArticleProse
            html={bodyHtml}
            className={cn(
              notesBodyClass,
              "[&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-snug [&_h1]:tracking-tight sm:[&_h1]:text-3xl",
              "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
              "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight",
              "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
              "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-sm",
              "[&_figure]:my-6",
              "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground",
              "[&_strong]:font-semibold",
            )}
          />
        </div>
      </article>
    </div>
  );
}
