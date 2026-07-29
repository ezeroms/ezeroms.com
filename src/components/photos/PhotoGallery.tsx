"use client";

import { useEffect, useMemo, useState } from "react";
import type { Photo } from "@/types/content";
import {
  photoAccessibilityLabel,
  photoGridSrc,
} from "@/lib/content/photo-caption";
import { cn } from "@/lib/cn";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { usePhotoLightbox } from "@/components/photos/usePhotoLightbox";
import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";

type Props = {
  items: Photo[];
  /**
   * PC（≥1080）の列数。通常一覧は 4、検索結果などは 3。
   * タブレット以下には影響しない。
   */
  desktopColumns?: 3 | 4;
  /** 詳細ページ URL 用。指定時ライトボックスにシェアを出す。 */
  galleryId?: PhotoGalleryId;
};

/** Shell 幅に合わせた列数: スマホ 2 / タブレット 3 / PC は指定 */
function galleryColumnCount(desktopColumns: 3 | 4): number {
  if (typeof window === "undefined") return 2;
  if (window.matchMedia("(min-width: 1080px)").matches) return desktopColumns;
  if (window.matchMedia("(min-width: 768px)").matches) return 3;
  return 2;
}

/** 新しい順の配列を左→右に振り分け、各列へ上から積む（隙間のない masonry） */
function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  for (let i = 0; i < items.length; i++) {
    columns[i % columnCount]!.push(items[i]!);
  }
  return columns;
}

/**
 * Smile / Jampai / Tabekake の写真一覧。
 * 新しいものから左→右に振り分け、各列で上に詰める（Pinterest 風）。
 */
export function PhotoGallery({
  items,
  desktopColumns = 4,
  galleryId,
}: Props) {
  const detailBasePath = galleryId
    ? getPhotoGallery(galleryId).basePath
    : undefined;

  const [columnCount, setColumnCount] = useState(2);
  const {
    displayPhotos,
    isClientMounted,
    activePhoto,
    openLightbox,
    closeLightbox,
    showPreviousPhoto,
    showNextPhoto,
  } = usePhotoLightbox(items);

  useEffect(() => {
    function updateColumns() {
      setColumnCount(galleryColumnCount(desktopColumns));
    }
    updateColumns();
    const mqTablet = window.matchMedia("(min-width: 768px)");
    const mqDesktop = window.matchMedia("(min-width: 1080px)");
    mqTablet.addEventListener("change", updateColumns);
    mqDesktop.addEventListener("change", updateColumns);
    return () => {
      mqTablet.removeEventListener("change", updateColumns);
      mqDesktop.removeEventListener("change", updateColumns);
    };
  }, [desktopColumns]);

  const columns = useMemo(
    () => splitIntoColumns(displayPhotos, columnCount),
    [displayPhotos, columnCount],
  );

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
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                  onClick={() => openLightbox(photo.id)}
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
          detailBasePath={detailBasePath}
          onClose={closeLightbox}
          onShowPrevious={showPreviousPhoto}
          onShowNext={showNextPhoto}
        />
      ) : null}
    </>
  );
}
