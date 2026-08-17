"use client";

import { Copy } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
};

/**
 * 一覧行の複製アイコン。Open と同じ見た目。
 */
export function DuplicateContentButton({
  loading = false,
  disabled = false,
  className,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        "share-btn relative inline-flex shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
        "h-9 w-9 cursor-pointer text-foreground transition-[opacity,background-color]",
        "opacity-30 group-hover:opacity-100",
        "hover:bg-accent",
        "disabled:cursor-wait disabled:opacity-100",
        className,
      )}
      aria-label="複製"
      data-tooltip="複製"
      disabled={disabled || loading}
      onClick={(event) => {
        event.stopPropagation();
        if (loading || disabled) return;
        onClick();
      }}
    >
      <Copy className="h-4 w-4" aria-hidden />
    </button>
  );
}
