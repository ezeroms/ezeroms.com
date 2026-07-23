import { cn } from "@/lib/cn";

/**
 * Tag / topic chip styles.
 * Active is based on the default tag: same bg, body text color, foreground border.
 * `!` so legacy `a:link { color: inherit }` does not win.
 */
export function tagChipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-md border border-solid px-2 py-0.5 text-xs font-medium no-underline transition-colors",
    active
      ? "!border !border-solid !border-foreground bg-muted !text-foreground"
      : "border-transparent bg-muted !text-muted-foreground hover:!border-[hsl(var(--foreground)/0.22)] hover:bg-secondary hover:!text-foreground",
  );
}

/** Larger pill chips (e.g. Chronicle interest lenses). */
export function tagPillClass(active: boolean) {
  return cn(
    "rounded-full border border-solid px-3 py-1.5 text-sm no-underline transition-colors",
    active
      ? "!border !border-solid !border-foreground bg-muted !text-foreground"
      : "border-border bg-card !text-muted-foreground hover:border-foreground/30 hover:!text-foreground",
  );
}
