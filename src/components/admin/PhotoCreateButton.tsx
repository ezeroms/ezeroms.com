"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { PhotoEditModal } from "@/components/admin/PhotoEditModal";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";

type Props = {
  galleryId: PhotoGalleryId;
};

/** 「＋ コンテンツを追加」→ 新規作成モーダル */
export function PhotoCreateButton({ galleryId }: Props) {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => (
        <PhotoEditModal
          galleryId={galleryId}
          open={open}
          onClose={onClose}
        />
      )}
    </AdminCreateButton>
  );
}
