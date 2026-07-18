"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  children: ReactNode;
  /** 行クリック / Enter / Space で呼ばれる（a, button 内は除外） */
  onActivate: () => void;
};

/** テーブル行全体をクリック可能な行 */
export function AdminClickableRow({ className, children, onActivate }: Props) {
  function onClick(event: MouseEvent<HTMLTableRowElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button")) return;
    onActivate();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button")) return;
    event.preventDefault();
    onActivate();
  }

  return (
    <tr
      role="button"
      tabIndex={0}
      className={cn("group cursor-pointer", className)}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </tr>
  );
}
