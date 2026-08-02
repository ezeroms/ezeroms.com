"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Chronicle } from "@/types/content";
import { formatChronicleWhen } from "@/lib/content/chronicle-filter";
import { sanitizeBody } from "@/lib/html";
import { cn } from "@/lib/cn";
import { proseBodyClass } from "@/lib/site/prose-styles";

const POPOVER_WIDTH = 360;
const VIEW_MARGIN = 12;
const ANCHOR_GAP = 8;

export type AnchorRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type Props = {
  item: Chronicle;
  anchor: AnchorRect;
  onClose: () => void;
};

type Position = { top: number; left: number; maxHeight: number };

function computePosition(
  anchor: AnchorRect,
  popoverHeight: number,
): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxHeight = Math.min(480, vh - VIEW_MARGIN * 2);

  const spaceRight = vw - anchor.right - ANCHOR_GAP - VIEW_MARGIN;
  const spaceLeft = anchor.left - ANCHOR_GAP - VIEW_MARGIN;
  const preferRight =
    spaceRight >= POPOVER_WIDTH || spaceRight >= spaceLeft;

  let left = preferRight
    ? anchor.right + ANCHOR_GAP
    : anchor.left - ANCHOR_GAP - POPOVER_WIDTH;

  left = Math.max(
    VIEW_MARGIN,
    Math.min(left, vw - POPOVER_WIDTH - VIEW_MARGIN),
  );

  const height = Math.min(popoverHeight || 280, maxHeight);
  let top = anchor.top;
  top = Math.max(VIEW_MARGIN, Math.min(top, vh - height - VIEW_MARGIN));

  return { top, left, maxHeight };
}

/**
 * Google Calendar 風のイベント詳細ポップオーバー。
 * 背面はロックし、パネル内スクロールは維持する。
 */
export function ChronicleEventPopover({ item, anchor, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>(() =>
    computePosition(anchor, 280),
  );

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    setPosition(computePosition(anchor, el.getBoundingClientRect().height));
  }, [anchor, item.id]);

  // 背面スクロールロック（マトリクス・メイン含む）
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    const scrollRoots = [
      document.getElementById("chronicle-matrix"),
      document.getElementById("main-content"),
    ].filter((el): el is HTMLElement => Boolean(el));

    const previousStyles = scrollRoots.map((el) => ({
      el,
      overflow: el.style.overflow,
    }));
    for (const { el } of previousStyles) {
      el.style.overflow = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function handleResize() {
      onClose();
    }

    // 背面へのホイール／タッチスクロールを遮断（パネル内は除外）
    function handleWheel(event: WheelEvent) {
      const target = event.target as Node | null;
      if (panelRef.current?.contains(target)) return;
      event.preventDefault();
    }

    function handleTouchMove(event: TouchEvent) {
      const target = event.target as Node | null;
      if (panelRef.current?.contains(target)) return;
      event.preventDefault();
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      for (const { el, overflow } of previousStyles) {
        el.style.overflow = overflow;
      }
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onClose]);

  const when = formatChronicleWhen(item);
  const meta = [item.category, item.subcategory].filter(Boolean).join(" · ");
  const tags = item.chronicle_tag ?? [];
  const body = item.body_html?.trim()
    ? sanitizeBody(item.body_html)
    : item.description
      ? `<p>${escapeHtml(item.description)}</p>`
      : "";

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="presentation">
      {/* 透明オーバーレイ：背面操作・スクロールを遮断 */}
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default border-0 p-0"
        style={{ backgroundColor: "transparent" }}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chronicle-popover-title"
        className="absolute flex flex-col overflow-hidden rounded-lg bg-white"
        style={{
          top: position.top,
          left: position.left,
          width: POPOVER_WIDTH,
          maxHeight: position.maxHeight,
          boxShadow:
            "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)",
          outline: "1px solid rgba(60,64,67,0.08)",
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-4 pb-2 pt-3">
          <p className="m-0 text-xs text-[#70757a]">
            <time dateTime={item.date}>{when}</time>
            {meta ? ` · ${meta}` : ""}
          </p>
          <h2
            id="chronicle-popover-title"
            className="m-0 mt-1 text-base font-medium leading-snug text-[#3c4043]"
          >
            {item.title}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-1">
          {tags.length ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-[#f1f3f4] px-2 py-0.5 text-xs text-[#3c4043]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {body ? (
            <div
              className={cn(
                "text-sm leading-relaxed text-[#3c4043]",
                "[&_p]:my-2.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
                proseBodyClass,
              )}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="m-0 text-sm text-[#70757a]">
              詳細はありません。
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
