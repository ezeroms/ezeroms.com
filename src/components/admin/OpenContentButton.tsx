"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  className?: string;
};

/**
 * 公開ページを開くアイコン。
 * Notes カードの Share（リンクコピー）と同じ見た目。ツールチップだけ Open。
 */
export function OpenContentButton({ href, className }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "share-btn relative inline-flex shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
        "h-9 w-9 cursor-pointer text-foreground transition-[opacity,background-color]",
        "opacity-30 group-hover:opacity-100",
        "hover:bg-accent",
        className,
      )}
      aria-label="Open"
      data-tooltip="Open"
      onClick={(event) => event.stopPropagation()}
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
    </a>
  );
}
