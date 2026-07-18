"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  /** 行右寄りの選択状態サマリー（「指定なし」など） */
  summary: string;
  open: boolean;
  onToggle: () => void;
  /** 2行目以降のセクション先頭に区切り線を付ける */
  showTopBorder?: boolean;
  /** 展開時の選択肢エリアの高さ上限 */
  contentMaxHeightClassName?: string;
  children: ReactNode;
};

/**
 * 絞り込みパネル内の1セクション（ラベル + 要約 + 展開）。
 * Notes / Column / Photo など各 FilterPanel で共通利用する。
 */
export function FilterAccordionRow({
  label,
  summary,
  open,
  onToggle,
  showTopBorder = false,
  contentMaxHeightClassName = "max-h-52",
  children,
}: Props) {
  return (
    <div className={cn(showTopBorder && "border-t border-border")}>
      <button
        type="button"
        className={cn(
          "grid w-full grid-cols-[auto_1fr_auto] items-center gap-2",
          "border-0 bg-transparent px-3 py-2.5 text-left",
          "cursor-pointer text-foreground hover:bg-accent",
        )}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="whitespace-nowrap text-sm font-semibold">{label}</span>
        <span className="truncate text-sm text-muted-foreground">
          {summary}
        </span>
        <span className="text-xs text-muted-foreground" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div
          className={cn(
            "overflow-y-auto border-t border-border px-3 py-2.5",
            contentMaxHeightClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
