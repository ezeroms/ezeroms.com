import { cn } from "@/lib/cn";

/**
 * Tag / topic chip styles.
 * Active is based on the default tag: same bg, body text color, foreground border.
 * `!` so legacy `a:link { color: inherit }` does not win.
 */
export function tagChipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-md border border-solid px-2 py-0.5 text-xs font-medium no-underline transition-colors",
    "appearance-none shadow-none",
    active
      ? "!border !border-solid !border-foreground bg-muted !text-foreground"
      : "border-transparent bg-muted !text-muted-foreground hover:!border-[hsl(var(--foreground)/0.22)] hover:bg-secondary hover:!text-foreground",
  );
}

/**
 * 検索モーダル内の絞り込みチップ（一覧タグと同系、やや大きめ）。
 */
export function filterChipClass(active: boolean) {
  return cn(
    tagChipClass(active),
    "max-w-full px-2.5 py-1 text-sm leading-snug",
    "focus-visible:outline-none",
  );
}

/** 検索モーダルの日付フィールドなど、フラットな入力面。 */
export function filterFieldClass(opts?: {
  empty?: boolean;
  className?: string;
}) {
  return cn(
    "appearance-none shadow-none outline-none",
    "min-w-0 rounded-md border border-transparent bg-muted px-3 py-2 text-left text-sm",
    "transition-colors hover:bg-secondary",
    "focus-visible:border-foreground/25",
    opts?.empty ? "text-muted-foreground" : "text-foreground",
    opts?.className,
  );
}

/** Larger pill chips (e.g. Chronicle interest lenses). */
export function tagPillClass(active: boolean) {
  return cn(
    "rounded-full border border-solid px-3 py-1.5 text-sm no-underline transition-colors",
    "appearance-none shadow-none",
    active
      ? "!border !border-solid !border-foreground bg-muted !text-foreground"
      : "border-border bg-card !text-muted-foreground hover:border-foreground/30 hover:!text-foreground",
  );
}
