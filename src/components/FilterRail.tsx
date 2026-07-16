"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, PanelRightClose, X } from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "ezeroms.filter-rail.expanded";
const WIDE_MQ = "(min-width: 1080px)";

type Props = {
  children: React.ReactNode;
};

/**
 * Right filter rail that can collapse to a bottom-right FAB.
 * Narrow viewports start collapsed; wide start expanded (unless user minimized).
 */
export function FilterRail({ children }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [isWide, setIsWide] = useState(true);
  const [userExpanded, setUserExpanded] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(WIDE_MQ);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setIsWide(mq.matches);
    if (stored === "0") setUserExpanded(false);
    if (stored === "1") setUserExpanded(true);
    setHydrated(true);

    function onChange(e: MediaQueryListEvent) {
      setIsWide(e.matches);
      if (!e.matches) setSheetOpen(false);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const railExpanded = hydrated && isWide && userExpanded;
  const showFab = hydrated && (!isWide || !userExpanded);

  const minimize = useCallback(() => {
    setUserExpanded(false);
    setSheetOpen(false);
    window.localStorage.setItem(STORAGE_KEY, "0");
  }, []);

  const expandWide = useCallback(() => {
    setUserExpanded(true);
    setSheetOpen(false);
    window.localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const openSheet = useCallback(() => {
    if (isWide) {
      expandWide();
      return;
    }
    setSheetOpen(true);
  }, [isWide, expandWide]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    if (!sheetOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSheet();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetOpen, closeSheet]);

  return (
    <>
      {/* Wide expanded rail */}
      {railExpanded ? (
        <aside
          className={cn(
            "layout-tags",
            "flex min-h-0 w-52 shrink-0 flex-col self-stretch",
            "!border-0 !bg-transparent !p-0",
          )}
          aria-label="絞り込み"
        >
          <div
            className={cn(
              "flex h-full min-h-0 w-full flex-col overflow-hidden",
              "rounded-xl border border-border bg-card p-3 shadow-sm",
            )}
          >
            <div className="mb-2 flex shrink-0 items-center justify-end">
              <button
                type="button"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md border-0",
                  "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                onClick={minimize}
                aria-label="絞り込みを最小化"
                title="最小化"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </div>
        </aside>
      ) : null}

      {/* Placeholder so layout gap stays consistent while hydrating on wide */}
      {!hydrated ? (
        <aside
          className="hidden min-h-0 w-52 shrink-0 min-[1080px]:block"
          aria-hidden
        />
      ) : null}

      {/* FAB */}
      {showFab ? (
        <button
          type="button"
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "inline-flex h-12 w-12 items-center justify-center rounded-full",
            "border border-border bg-card text-foreground shadow-lg",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          onClick={openSheet}
          aria-label="絞り込みを開く"
        >
          <Filter className="h-5 w-5" />
        </button>
      ) : null}

      {/* Narrow overlay sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/40"
            aria-label="閉じる"
            onClick={closeSheet}
          />
          <div
            className={cn(
              "relative flex h-full w-full max-w-sm flex-col",
              "border-l border-border bg-card p-4 shadow-xl",
            )}
          >
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                絞り込み
              </p>
              <button
                type="button"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md border-0",
                  "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                onClick={closeSheet}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
