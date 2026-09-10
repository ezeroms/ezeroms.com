import { cn } from "@/lib/cn";

/**
 * TRIAL: resting card outline.
 * Match admin table thead rule (`#e8eaed` / `--border`).
 */
export const cardOutlineClass = "border border-solid border-border";

/** Shared blog card chrome (Diary / Column / Works / etc.). */
export const contentCardClass = cn(
  "content-card overflow-hidden rounded-xl bg-card",
  cardOutlineClass,
);

/** Add when the whole card is a link — outline strengthens on hover/focus. */
export const contentCardLinkClass = "content-card--link";

export function contentCard(opts?: { link?: boolean; className?: string }) {
  return cn(
    contentCardClass,
    opts?.link && contentCardLinkClass,
    opts?.className,
  );
}
