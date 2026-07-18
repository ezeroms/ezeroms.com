"use client";

import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/types/content";
import {
  photoAccessibilityLabel,
  photosWithImageUrl,
} from "@/lib/content/photo-caption";
import { cn } from "@/lib/cn";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";

type Props = {
  items: Photo[];
};

/**
 * Smile / Jampai の写真一覧。
 * グリッドは写真のみ（カード枠・キャプションなし）。クリックでライトボックスを開く。
 */
export function PhotoGallery({ items }: Props) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  // portal はブラウザでのみ使えるため、マウント後にライトボックスを描画する
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const displayPhotos = photosWithImageUrl(items);
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
        className="columns-2 gap-1 sm:columns-3 lg:columns-4"
        role="list"
        aria-label="写真ギャラリー"
      >
        {displayPhotos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            role="listitem"
            className={cn(
              "mb-1 block w-full break-inside-avoid border-0 bg-transparent p-0",
              "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            onClick={() => setActivePhotoId(photo.id)}
            aria-label={`${photoAccessibilityLabel(photo)} を拡大表示`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.image_url!}
              alt=""
              className={cn(
                "m-0 block h-auto w-full",
                "transition-opacity duration-200 ease-out hover:opacity-80",
              )}
              loading="lazy"
              decoding="async"
            />
          </button>
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