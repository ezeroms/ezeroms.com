import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Detail-page block: heading + related post list under the article card. */
export function RelatedPostsSection({ children }: Props) {
  return (
    <section
      className="mx-auto mt-10 w-full max-w-3xl"
      aria-labelledby="related-posts-heading"
    >
      <h2
        id="related-posts-heading"
        className="mb-4 text-base font-semibold tracking-tight text-foreground"
      >
        Related posts
      </h2>
      {children}
    </section>
  );
}
