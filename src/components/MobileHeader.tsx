"use client";

import { MobileMenuButton } from "@/components/MobileMenuButton";
import { cn } from "@/lib/cn";

type Props = {
  title?: string;
  className?: string;
};

/**
 * Fallback chrome when SiteShell has no sticky breadcrumb header.
 * Hidden on desktop (≥1080px). Logo belongs in page content, not here.
 */
export function MobileHeader({ title, className }: Props) {
  return (
    <header
      className={cn(
        "flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-background px-4",
        "min-[1080px]:hidden",
        className,
      )}
    >
      <MobileMenuButton />
      {title ? (
        <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-wide text-foreground">
          {title}
        </span>
      ) : null}
    </header>
  );
}
