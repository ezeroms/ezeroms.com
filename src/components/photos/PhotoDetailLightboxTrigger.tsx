"use client";

import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { usePhotoLightbox } from "@/components/photos/usePhotoLightbox";
import { photoAccessibilityLabel } from "@/lib/content/photo-caption";
import { cn } from "@/lib/cn";
import type { Photo } from "@/types/content";

type Props = {
  photo: Photo;
  /** ギャラリー内の公開写真（日付新しい順）。ライトボックスの前後ナビに使う。 */
  photos: Photo[];
  detailBasePath: string;
  imageAlt: string;
};

/**
 * 詳細ページのメイン画像。クリックで一覧と同じライトボックスを開く。
 */
export function PhotoDetailLightboxTrigger({
  photo,
  photos,
  detailBasePath,
  imageAlt,
}: Props) {
  const {
    displayPhotos,
    isClientMounted,
    activePhoto,
    openLightbox,
    closeLightbox,
    showPreviousPhoto,
    showNextPhoto,
  } = usePhotoLightbox(photos);

  if (!photo.image_url) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
        画像がありません
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "m-0 block w-full cursor-pointer border-0 bg-transparent p-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        onClick={() => openLightbox(photo.id)}
        aria-label={`${photoAccessibilityLabel(photo)} を拡大表示`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={imageAlt}
          className="m-0 block h-auto w-full transition-opacity duration-200 ease-out hover:opacity-80"
        />
      </button>

      {isClientMounted && activePhoto ? (
        <PhotoLightbox
          photo={activePhoto}
          photos={displayPhotos}
          detailBasePath={detailBasePath}
          onClose={closeLightbox}
          onShowPrevious={showPreviousPhoto}
          onShowNext={showNextPhoto}
        />
      ) : null}
    </>
  );
}
