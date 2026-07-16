"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/types/content";
import { formatPhotoDate } from "@/lib/content/photo-filter";
import { cn } from "@/lib/cn";

type Props = {
  items: Photo[];
  basePath: string;
};

/** Masonry photo gallery with lightbox. */
export function PhotoMasonry({ items, basePath }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const withImage = items.filter((p) => p.image_url?.trim());
  const activeIndex = withImage.findIndex((p) => p.id === activeId);
  const active = activeIndex >= 0 ? withImage[activeIndex] : null;

  const close = useCallback(() => setActiveId(null), []);

  const goPrev = useCallback(() => {
    if (activeIndex < 0 || withImage.length === 0) return;
    const next =
      withImage[(activeIndex - 1 + withImage.length) % withImage.length];
    setActiveId(next.id);
  }, [activeIndex, withImage]);

  const goNext = useCallback(() => {
    if (activeIndex < 0 || withImage.length === 0) return;
    const next = withImage[(activeIndex + 1) % withImage.length];
    setActiveId(next.id);
  }, [activeIndex, withImage]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, close, goPrev, goNext]);

  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        条件に合う写真がありません。
      </p>
    );
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
        {items.map((item) => {
          const href = `${basePath}${item.slug}/`;
          return (
            <article
              key={item.id}
              className={cn(
                "mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card",
                "shadow-sm transition-shadow hover:shadow-md",
              )}
            >
              {item.image_url ? (
                <button
                  type="button"
                  className="block w-full cursor-zoom-in overflow-hidden border-0 bg-muted p-0"
                  onClick={() => setActiveId(item.id)}
                  aria-label={`${item.title} を拡大表示`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="m-0 block h-auto w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ) : (
                <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
                  No image
                </div>
              )}

              <div className="flex flex-col gap-1.5 p-3.5">
                <p className="m-0 text-[11px] text-muted-foreground">
                  {formatPhotoDate(item.date)}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
                <h2 className="m-0 text-[15px] font-semibold leading-snug tracking-tight">
                  <Link
                    href={href}
                    className="text-foreground no-underline hover:underline hover:underline-offset-2"
                  >
                    {item.title}
                  </Link>
                </h2>
              </div>
            </article>
          );
        })}
      </div>

      {active?.image_url ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          aria-label={active.title}
          onClick={close}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md border-0 bg-transparent px-3 py-2 text-2xl text-white hover:opacity-70"
            onClick={close}
            aria-label="閉じる"
          >
            ×
          </button>
          {withImage.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md border-0 bg-transparent px-3 py-2 text-3xl text-white hover:opacity-70 sm:left-4"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="前の写真"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border-0 bg-transparent px-3 py-2 text-3xl text-white hover:opacity-70 sm:right-4"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="次の写真"
              >
                ›
              </button>
            </>
          ) : null}
          <figure
            className="m-0 flex max-h-full max-w-5xl flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.image_url}
              alt={active.title}
              className="m-0 max-h-[80vh] w-auto max-w-full object-contain"
            />
            <figcaption className="text-center text-sm text-white/90">
              <span className="font-medium">{active.title}</span>
              {active.location || active.camera ? (
                <span className="mt-1 block text-xs text-white/70">
                  {[active.location, active.camera].filter(Boolean).join(" · ")}
                </span>
              ) : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
