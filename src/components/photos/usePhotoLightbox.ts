"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { photosWithImageUrl } from "@/lib/content/photo-caption";
import type { Photo } from "@/types/content";

/**
 * 一覧・詳細で共通のライトボックス開閉と前後ナビ。
 * activePhotoId が null のときは閉じている。
 */
export function usePhotoLightbox(photos: Photo[]) {
  const displayPhotos = useMemo(
    () => photosWithImageUrl(photos),
    [photos],
  );

  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  // portal は document 依存なので、マウント後にだけ描画する
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const activeIndex = displayPhotos.findIndex(
    (photo) => photo.id === activePhotoId,
  );
  const activePhoto =
    activeIndex >= 0 ? displayPhotos[activeIndex]! : null;

  const openLightbox = useCallback((photoId: string) => {
    setActivePhotoId(photoId);
  }, []);

  const closeLightbox = useCallback(() => {
    setActivePhotoId(null);
  }, []);

  const showPreviousPhoto = useCallback(() => {
    if (activeIndex < 0 || displayPhotos.length === 0) return;
    const previousIndex =
      (activeIndex - 1 + displayPhotos.length) % displayPhotos.length;
    setActivePhotoId(displayPhotos[previousIndex]!.id);
  }, [activeIndex, displayPhotos]);

  const showNextPhoto = useCallback(() => {
    if (activeIndex < 0 || displayPhotos.length === 0) return;
    const nextIndex = (activeIndex + 1) % displayPhotos.length;
    setActivePhotoId(displayPhotos[nextIndex]!.id);
  }, [activeIndex, displayPhotos]);

  return {
    displayPhotos,
    isClientMounted,
    activePhoto,
    openLightbox,
    closeLightbox,
    showPreviousPhoto,
    showNextPhoto,
  };
}
