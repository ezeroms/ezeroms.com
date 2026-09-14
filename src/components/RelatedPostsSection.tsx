import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  /** スクリーンリーダー用（既定: Related）。画面には出さない。 */
  title?: string;
  /** aria / 見出し id（未指定時は title から生成） */
  headingId?: string;
  className?: string;
};

/** Detail-page block: related posts under the article. Heading is screen-reader only. */
export function RelatedPostsSection({
  children,
  title = "Related",
  headingId,
  className,
}: Props) {
  const id =
    headingId ??
    `posts-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section
      className={cn("mx-auto mt-10 w-full max-w-3xl", className)}
      aria-labelledby={id}
    >
      <h2 id={id} className="sr-only">
        {title}
      </h2>
      {children}
    </section>
  );
}
