"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Photo } from "@/types/content";
import {
  photoAccessibilityLabel,
  photoGridSrc,
  photosWithImageUrl,
} from "@/lib/content/photo-caption";
import { cn } from "@/lib/cn";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";

type Props = {
  items: Photo[];
};

/** Tailwind sm / lg に合わせた列数（ピンタレスト風の列積み用） */
function galleryColumnCount(): number {
  if (typeof window === "undefined") return 2;
  if (window.matchMedia("(min-width: 1024px)").matches) return 4;
  if (window.matchMedia("(min-width: 640px)").matches) return 3;
  return 2;
}

/** 新しい順の配列を、左→右に振り分けて各列へ積む（空白のない masonry） */
function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  for (let i = 0; i < items.length; i++) {
    columns[i % columnCount].push(items[i]!);
  }
  return columns;
}

/**
 * Smile / Jampai / Kuikake の写真一覧。
 * 新しいものから左→右に振り分け、各列で上に詰める（Pinterest 風）。
 */
export function PhotoGallery({ items }: Props) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    setIsClientMounted(true);
    function updateColumns() {
      setColumnCount(galleryColumnCount());
    }
    updateColumns();
    const mqSm = window.matchMedia("(min-width: 640px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");
    mqSm.addEventListener("change", updateColumns);
    mqLg.addEventListener("change", updateColumns);
    return () => {
      mqSm.removeEventListener("change", updateColumns);
      mqLg.removeEventListener("change", updateColumns);
    };
  }, []);

  const displayPhotos = photosWithImageUrl(items);
  const columns = useMemo(
    () => splitIntoColumns(displayPhotos, columnCount),
    [displayPhotos, columnCount],
  );

  const activeIndex = displayPhotos.findIndex(
    (photo) => photo.id === activePhotoId,
  );
  const activePhoto = activeIndex >= 0 ? displayPhotos[activeIndex] : null;

  const closeLightbox = useCallback(() => {
    setActivePhotoId(null);
  }, []);

  const showPreviousPhoto = useCallback(() => {
    if (activeIndex < 0 || displayPhotos.length === 0) return;
    const previousIndex =
      (activeIndex - 1 + displayPhotos.length) % displayPhotos.length;
    setActivePhotoId(displayPhotos[previousIndex].id);
  }, [activeIndex, displayPhotos]);

  const showNextPhoto = useCallback(() => {
    if (activeIndex < 0 || displayPhotos.length === 0) return;
    const nextIndex = (activeIndex + 1) % displayPhotos.length;
    setActivePhotoId(displayPhotos[nextIndex].id);
  }, [activeIndex, displayPhotos]);

  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        条件に合う写真がありません。
      </p>
    );
  }

  return (
    <>
      <div
        className="flex items-start gap-1"
        role="list"
        aria-label="写真ギャラリー"
      >
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex min-w-0 flex-1 flex-col gap-1"
          >
            {column.map((photo) => {
              const gridSrc = photoGridSrc(photo);
              if (!gridSrc) return null;
              return (
                <button
                  key={photo.id}
                  type="button"
                  role="listitem"
                  className={cn(
                    "block w-full border-0 bg-transparent p-0",
                    "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                  onClick={() => setActivePhotoId(photo.id)}
                  aria-label={`${photoAccessibilityLabel(photo)} を拡大表示`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gridSrc}
                    alt=""
                    className={cn(
                      "m-0 block h-auto w-full",
                      "transition-opacity duration-200 ease-out hover:opacity-80",
                    )}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {isClientMounted && activePhoto ? (
        <PhotoLightbox
          photo={activePhoto}
          photos={displayPhotos}
          onClose={closeLightbox}
          onShowPrevious={showPreviousPhoto}
          onShowNext={showNextPhoto}
        />
      ) : null}
    </>
  );
}
