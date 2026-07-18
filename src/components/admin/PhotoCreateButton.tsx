"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoEditModal } from "@/components/admin/PhotoEditModal";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";

type Props = {
  galleryId: PhotoGalleryId;
};

/** 「＋ コンテンツを追加」→ 新規作成モーダル */
export function PhotoCreateButton({ galleryId }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <PhotoEditModal
        galleryId={galleryId}
        open={open}
        onClose={close}
      />
    </>
  );
}
