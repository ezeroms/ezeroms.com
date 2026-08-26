"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLightboxSwipe } from "@/components/useLightboxSwipe";

export type LightboxImage = {
  src: string;
  alt: string;
};

type Props = {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onShowPrevious: () => void;
  onShowNext: () => void;
};

const navButtonClassName =
  "absolute top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-2 text-white/70 transition-colors hover:text-white min-[768px]:inline-flex";

/**
 * 記事本文などの画像拡大。Photos のライトボックスと同じ黒背景。
 */
export function ImageLightbox({
  images,
  index,
  onClose,
  onShowPrevious,
  onShowNext,
}: Props) {
  const image = images[index];
  const showNavigation = images.length > 1;
  const swipe = useLightboxSwipe({
    enabled: showNavigation,
    onPrevious: onShowPrevious,
    onNext: onShowNext,
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onShowPrevious();
      if (event.key === "ArrowRight") onShowNext();
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, onShowPrevious, onShowNext]);

  if (!image) return null;

  const caption = image.alt.trim();

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex touch-none items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal
      aria-label={caption || "画像"}
      onPointerDown={swipe.onPointerDown}
      onPointerUp={swipe.onPointerUp}
      onPointerCancel={swipe.onPointerCancel}
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default border-0 p-0"
        style={{ backgroundColor: "#000" }}
        onClick={() => {
          if (swipe.didSwipe()) return;
          onClose();
        }}
      />

      {showNavigation ? (
        <>
          <button
            type="button"
            className={`${navButtonClassName} left-1 sm:left-4`}
            onClick={onShowPrevious}
            aria-label="前の画像"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={`${navButtonClassName} right-1 sm:right-4`}
            onClick={onShowNext}
            aria-label="次の画像"
          >
            <ChevronRight className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </button>
        </>
      ) : null}

      <figure className="relative z-10 m-0 flex max-h-full max-w-6xl flex-col items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={caption || ""}
          className="m-0 max-h-[85vh] w-auto max-w-full object-contain"
        />
        {caption ? (
          <figcaption className="text-sm tracking-wide text-white/65">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </div>,
    document.body,
  );
}
