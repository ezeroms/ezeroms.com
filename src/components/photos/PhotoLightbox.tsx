"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import type { Photo } from "@/types/content";
import {
  formatPhotoCaption,
  photoAccessibilityLabel,
} from "@/lib/content/photo-caption";
import { photoDetailHref } from "@/lib/content/photo-adjacent";

type Props = {
  photo: Photo;
  /** 前後ナビ用。1件だけのときはナビを出さない。 */
  photos: Photo[];
  /** 詳細ページのベースパス（例: `/smile/`）。指定時キャプション横にシェアを出す。 */
  detailBasePath?: string;
  onClose: () => void;
  onShowPrevious: () => void;
  onShowNext: () => void;
};

const navButtonClassName =
  "absolute top-1/2 z-10 inline-flex -translate-y-1/2 items-center justify-center border-0 bg-transparent p-2 text-white/70 transition-colors hover:text-white";

/**
 * 写真拡大表示。
 * layout の overflow に閉じ込められないよう document.body へ portal する。
 */
export function PhotoLightbox({
  photo,
  photos,
  detailBasePath,
  onClose,
  onShowPrevious,
  onShowNext,
}: Props) {
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
  const detailPath = detailBasePath
    ? photoDetailHref(detailBasePath, photo.slug)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal
      aria-label={photoAccessibilityLabel(photo)}
    >
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

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
            className={`${navButtonClassName} left-1 sm:left-4`}
            onClick={onShowPrevious}
            aria-label="前の写真"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={`${navButtonClassName} right-1 sm:right-4`}
            onClick={onShowNext}
            aria-label="次の写真"
          >
            <ChevronRight className="h-8 w-8" strokeWidth={1.75} aria-hidden />
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
        {caption || detailPath ? (
          <figcaption className="flex items-center justify-center gap-1.5 text-sm tracking-wide text-white/65">
            {caption ? <span>{caption}</span> : null}
            {detailPath ? (
              <ShareButton
                path={detailPath}
                className="bg-transparent text-white opacity-40 hover:bg-white/20 hover:opacity-100"
              />
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    </div>,
    document.body,
  );
}
