"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/types/content";
import {
  formatPhotoCaption,
  photoAccessibilityLabel,
} from "@/lib/content/photo-caption";

type Props = {
  photo: Photo;
  /** 前後ナビ用。1件だけのときはナビを出さない。 */
  photos: Photo[];
  onClose: () => void;
  onShowPrevious: () => void;
  onShowNext: () => void;
};

/**
 * 写真拡大表示。
 * layout の overflow に閉じ込められないよう document.body へ portal する。
 */
export function PhotoLightbox({
  photo,
  photos,
  onClose,
  onShowPrevious,
  onShowNext,
}: Props) {
  // Esc / 矢印キー、および背面スクロールのロック
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

  if (!photo.image_url) return null;

  const caption = formatPhotoCaption(photo);
  const showNavigation = photos.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal
      aria-label={photoAccessibilityLabel(photo)}
    >
      {/*
        黒オーバーレイは専用レイヤー。
        Tailwind の bg-* がレガシー CSS に負けることがあるため inline style を使う。
      */}
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default border-0 p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
        onClick={onClose}
      />

      {showNavigation ? (
        <>
          <button
            type="button"
            className="absolute left-1 top-1/2 z-10 -translate-y-1/2 border-0 bg-transparent px-3 py-2 text-3xl leading-none text-white/70 hover:text-white sm:left-4"
            onClick={onShowPrevious}
            aria-label="前の写真"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 border-0 bg-transparent px-3 py-2 text-3xl leading-none text-white/70 hover:text-white sm:right-4"
            onClick={onShowNext}
            aria-label="次の写真"
          >
            ›
          </button>
        </>
      ) : null}

      <figure className="relative z-10 m-0 flex max-h-full max-w-6xl flex-col items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={photoAccessibilityLabel(photo)}
          className="m-0 max-h-[85vh] w-auto max-w-full object-contain"
        />
        {caption ? (
          <figcaption className="text-center text-sm tracking-wide text-white/65">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </div>,
    document.body,
  );
}
