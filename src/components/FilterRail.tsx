"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** 絞り込みが効いているとき、閉じた FAB をアクティブ色にする */
  active?: boolean;
};

/**
 * Filter control that stays one surface: FAB morphs into a tall floating card.
 * Does not reserve layout space in the content column.
 */
export function FilterRail({ children, active = false }: Props) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const openPanel = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, close]);

  if (!hydrated) return null;

  return (
    <div
      ref={rootRef}
      id={panelId}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex flex-col overflow-hidden",
        "border shadow-lg",
        "origin-bottom-right transition-[width,height,border-radius,box-shadow,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open
          ? "h-[min(72vh,30rem)] w-[min(calc(100vw-1.5rem),18.5rem)] rounded-2xl border-border bg-card text-foreground shadow-xl"
          : active
            ? "h-12 w-12 rounded-full border-primary bg-primary text-primary-foreground shadow-md"
            : "h-12 w-12 rounded-full border-border bg-card text-foreground",
      )}
      role={open ? "dialog" : undefined}
      aria-label={open ? "絞り込み" : undefined}
      aria-modal={open || undefined}
    >
      {!open ? (
        <button
          type="button"
          className={cn(
            "relative flex h-full w-full items-center justify-center border-0 bg-transparent",
            active
              ? "text-primary-foreground hover:bg-primary/90"
              : "text-foreground hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          onClick={openPanel}
          aria-label={active ? "絞り込みを開く（条件適用中）" : "絞り込みを開く"}
          aria-expanded={false}
          aria-controls={panelId}
        >
          <Filter className="h-5 w-5" />
          {active ? (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-foreground ring-2 ring-primary"
              aria-hidden
            />
          ) : null}
        </button>
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <Filter className="h-4 w-4" />
              </span>
              <p className="m-0 text-sm font-semibold tracking-tight">
                絞り込み
                {active ? (
                  <span className="ml-1.5 text-xs font-medium text-primary">
                    適用中
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border-0",
                "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              onClick={close}
              aria-label="絞り込みを閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2">
            <div
              className={cn(
                "h-full min-h-0 overflow-hidden [&_>div]:h-full",
                /* Panel chrome already has a title — hide the nested one */
                "[&_[data-filter-panel-title]]:hidden",
              )}
            >
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
