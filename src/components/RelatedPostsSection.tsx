import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  /** 見出し文言（既定: Related posts） */
  title?: string;
  /** aria / 見出し id（未指定時は title から生成） */
  headingId?: string;
  className?: string;
};

/** Detail-page block: heading + post card list under the article. */
export function RelatedPostsSection({
  children,
  title = "Related posts",
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
      <h2
        id={id}
        className="mb-4 text-base font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
