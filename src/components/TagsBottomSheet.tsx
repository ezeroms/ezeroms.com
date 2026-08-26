"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Tags, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";

export type TagsBottomSheetProps = {
  items: string[];
  selected?: string | null;
  allHref: string;
  hrefFor: (item: string) => string;
  ariaLabel: string;
  sheetTitle: string;
  emptyLabel: string;
  chooseLabel: string;
};

export const TAGS_BOTTOM_SHEET_COPY = {
  ariaLabel: "タグ一覧",
  sheetTitle: "Tags",
  emptyLabel: "タグがありません",
  chooseLabel: "タグを選ぶ",
} as const;

const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const SHEET_MS = 340;
/** この距離以上下にドラッグしたら閉じる */
const DISMISS_PX = 88;
/** 短いドラッグでも、下方向の速度がこれ以上なら閉じる */
const DISMISS_VELOCITY = 0.55;

/**
 * スマホ／タブレット: 右下 FAB → ボトムシートでタグを選ぶ。
 * PC のタグ一覧は SiteShell 右レール（ReadingTagsAside）。
 */
export function TagsBottomSheet({
  items,
  selected = null,
  allHref,
  hrefFor,
  ariaLabel,
  sheetTitle,
  emptyLabel,
  chooseLabel,
}: TagsBottomSheetProps) {
  const sorted = [...items].sort((a, b) => a.localeCompare(b, "ja"));
  if (!sorted.length) return null;

  return (
    <TagsBottomSheetPanel
      items={sorted}
      selected={selected}
      allHref={allHref}
      hrefFor={hrefFor}
      ariaLabel={ariaLabel}
      sheetTitle={sheetTitle}
      emptyLabel={emptyLabel}
      chooseLabel={chooseLabel}
    />
  );
}

function TagsBottomSheetPanel({
  items,
  selected = null,
  allHref,
  hrefFor,
  ariaLabel,
  sheetTitle,
  emptyLabel,
  chooseLabel,
}: TagsBottomSheetProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    lastY: number;
    lastT: number;
    fromList: boolean;
  } | null>(null);
  const filtered = Boolean(selected);

  const visible = open || entered || dragging || dragY > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setEntered(false);
    setDragY(0);
    setDragging(false);
    dragRef.current = null;
  }, []);

  const openSheet = useCallback(() => {
    setOpen(true);
    setDragY(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    close();
  }, [selected, close]);

  const finishClose = useCallback(() => {
    if (entered) return;
    setOpen(false);
    setDragY(0);
  }, [entered]);

  const onHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastY: event.clientY,
        lastT: performance.now(),
        fromList: false,
      };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onListPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      const nav = navRef.current;
      if (!nav || nav.scrollTop > 0) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastY: event.clientY,
        lastT: performance.now(),
        fromList: true,
      };
    },
    [],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dy = event.clientY - drag.startY;
    if (drag.fromList && dy <= 0) return;
    if (drag.fromList && dy > 8 && navRef.current && navRef.current.scrollTop <= 0) {
      event.preventDefault();
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setDragging(true);
    }
    drag.lastY = event.clientY;
    drag.lastT = performance.now();
    setDragY(Math.max(0, dy));
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        dragRef.current = null;
        setDragging(false);
        return;
      }
      const dy = Math.max(0, event.clientY - drag.startY);
      const dt = Math.max(1, performance.now() - drag.lastT);
      const velocity = (event.clientY - drag.lastY) / dt;
      dragRef.current = null;
      setDragging(false);
      if (dy > DISMISS_PX || (dy > 24 && velocity > DISMISS_VELOCITY)) {
        close();
        return;
      }
      setDragY(0);
    },
    [close],
  );

  const onPointerCancel = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
    setDragY(0);
  }, []);

  if (!mounted) return null;

  const backdropOpacity = entered
    ? 0.45 * Math.max(0, 1 - dragY / 420)
    : 0;

  return createPortal(
    <div className="min-[1080px]:hidden">
      <button
        type="button"
        className={cn(
          "fixed z-[60] inline-flex h-12 w-12 cursor-pointer items-center justify-center",
          "appearance-none rounded-full border border-solid border-border bg-white",
          "text-foreground shadow-none outline-none transition-colors",
          "hover:border-border-hover",
          "focus-visible:ring-2 focus-visible:ring-border-hover focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "right-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))]",
        )}
        aria-label={filtered ? `${chooseLabel}（${selected}）` : chooseLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSheet}
      >
        <Tags className="h-5 w-5" aria-hidden />
        {filtered ? (
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-foreground"
            aria-hidden
          />
        ) : null}
      </button>

      {visible ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          role="presentation"
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 m-0 cursor-default border-0 p-0"
            style={{
              backgroundColor: "#000",
              opacity: backdropOpacity,
              transition: dragging
                ? "none"
                : `opacity ${SHEET_MS}ms ${SHEET_EASE}`,
            }}
            onClick={close}
          />

          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative z-10 flex w-full max-h-[80vh] flex-col",
              "rounded-t-2xl bg-white",
              "pb-[env(safe-area-inset-bottom)]",
            )}
            style={{
              transform: `translateY(${entered ? `${dragY}px` : "100%"})`,
              transition: dragging
                ? "none"
                : `transform ${SHEET_MS}ms ${SHEET_EASE}`,
            }}
            onTransitionEnd={(event) => {
              if (event.target !== sheetRef.current) return;
              if (event.propertyName !== "transform") return;
              finishClose();
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none flex-col active:cursor-grabbing"
              onPointerDown={onHeaderPointerDown}
            >
              <div className="flex justify-center pb-1 pt-2.5" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-neutral-300" />
              </div>
              <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
                <h2
                  id={titleId}
                  className="m-0 text-sm font-semibold tracking-wide text-foreground"
                >
                  {sheetTitle}
                </h2>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent",
                    "appearance-none text-muted-foreground shadow-none hover:text-foreground",
                  )}
                  aria-label="閉じる"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={close}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="h-px w-full shrink-0 bg-border" aria-hidden />

            <nav
              ref={navRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 touch-pan-y"
              aria-label={ariaLabel}
              onPointerDown={onListPointerDown}
            >
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                <li>
                  <Link
                    href={allHref}
                    className={cn(sidebarNavItemClass(!selected), "text-sm")}
                    onClick={close}
                  >
                    すべて
                  </Link>
                </li>
                {items.map((item) => {
                  const active = selected === item;
                  return (
                    <li key={item}>
                      <Link
                        href={hrefFor(item)}
                        className={cn(
                          sidebarNavItemClass(active),
                          "text-sm leading-snug",
                        )}
                        onClick={close}
                      >
                        {item}
                      </Link>
                    </li>
                  );
                })}
                {!items.length ? (
                  <li className="px-2 py-3 text-xs text-muted-foreground">
                    {emptyLabel}
                  </li>
                ) : null}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
