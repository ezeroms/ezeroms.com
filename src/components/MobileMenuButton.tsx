"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

/**
 * Opens the off-canvas sidebar (≤1079px). Hidden on desktop via CSS.
 * SiteScripts binds to #sidebar-hamburger-btn.
 */
export function MobileMenuButton({ className }: Props) {
  return (
    <button
      type="button"
      id="sidebar-hamburger-btn"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center p-0",
        "appearance-none border-0 bg-transparent shadow-none outline-none",
        "text-foreground hover:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-[1080px]:hidden",
        className,
      )}
      aria-label="メニューを開く"
      aria-expanded="false"
    >
      <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
