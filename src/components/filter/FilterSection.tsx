"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
  /** 長い選択肢リスト用。省略時は制限なし */
  contentClassName?: string;
};

/** 検索モーダル内の常時表示セクション（アコーディオンなし）。 */
export function FilterSection({
  label,
  children,
  className,
  contentClassName,
}: Props) {
  return (
    <section className={cn("space-y-2.5", className)}>
      <h3 className="m-0 text-xs font-semibold tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
