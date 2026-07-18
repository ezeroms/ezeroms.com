import { cn } from "@/lib/cn";
import { proseBodyClass } from "@/lib/site/prose-styles";

type Props = {
  /** Already sanitized body HTML */
  bodyHtml: string;
  title?: string;
  /** Full-bleed cover at the top of the card (Me) */
  coverSrc?: string | null;
};

/**
 * About（Me / Here / Contact）本文。
 * Column 詳細と同じ読み物カードの枠・タイポグラフィに揃える。
 */
export function AboutArticle({ bodyHtml, title, coverSrc }: Props) {
  return (
    <div className="w-full font-sans text-foreground">
      <article className="mx-auto min-w-0 w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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

          <div
            className={cn(
              "about-article__body min-w-0 text-base leading-relaxed text-foreground",
              proseBodyClass,
              "[&_p]:m-0 [&_p+p]:mt-4",
              "[&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-snug [&_h1]:tracking-tight sm:[&_h1]:text-3xl",
              "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
              "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight",
              "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
              "[&_hr]:my-6 [&_hr]:border-border",
              "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
              "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-sm",
              "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm",
              "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
              "[&_figure]:my-6",
              "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground",
              "[&_strong]:font-semibold",
            )}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </article>
    </div>
  );
}
