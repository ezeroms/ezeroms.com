import { cn } from "@/lib/cn";

/** Shared card chrome: Column-list style (rounded surface, no resting border). */
export const contentCardClass =
  "content-card overflow-hidden rounded-xl bg-card";

/** Add when the whole card is a link — border appears only on hover/focus. */
export const contentCardLinkClass = "content-card--link";

export function contentCard(opts?: { link?: boolean; className?: string }) {
  return cn(
    contentCardClass,
    opts?.link && contentCardLinkClass,
    opts?.className,
  );
}
