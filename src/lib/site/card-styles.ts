import { cn } from "@/lib/cn";

/**
 * TRIAL: resting card outline.
 * Match admin table thead rule (`#e8eaed` / `--border`).
 */
export const cardOutlineClass = "border border-solid border-border";

/** Shared blog card chrome (Notes / Column / Works / etc.). */
export const contentCardClass = cn(
  "content-card overflow-hidden rounded-xl bg-card",
  cardOutlineClass,
);

/** Add when the whole card is a link — outline strengthens on hover/focus. */
export const contentCardLinkClass = "content-card--link";

/** Admin / workspace surface panels (Projects, dashboard cards, calendar shell). */
export const surfaceCardClass = cn("rounded-md bg-card", cardOutlineClass);

export function contentCard(opts?: { link?: boolean; className?: string }) {
  return cn(
    contentCardClass,
    opts?.link && contentCardLinkClass,
    opts?.className,
  );
}

export function surfaceCard(opts?: { className?: string }) {
  return cn(surfaceCardClass, opts?.className);
}
