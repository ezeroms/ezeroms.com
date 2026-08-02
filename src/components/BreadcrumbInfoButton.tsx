"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  description: string;
  galleryLabel: string;
};

/**
 * パンくずのギャラリー名横に置く ?
 * クリックでタイトル＋説明のモーダルを開く。
 */
export function BreadcrumbInfoButton({ description, galleryLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const text = description.trim();
  if (!text) return null;

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0",
          "text-muted-foreground/70 transition-colors hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={`${galleryLabel} の説明を開く`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                aria-label="閉じる"
                className="absolute inset-0 m-0 cursor-default border-0 p-0"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
                onClick={() => setOpen(false)}
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className={cn(
                  "relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg",
                  "font-sans text-foreground",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent",
                    "text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  )}
                  aria-label="閉じる"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>

                <h2
                  id={titleId}
                  className="m-0 pr-8 text-lg font-semibold tracking-wide"
                >
                  {galleryLabel}
                </h2>
                <p
                  id={descriptionId}
                  className="mt-3 mb-0 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground"
                >
                  {text}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
