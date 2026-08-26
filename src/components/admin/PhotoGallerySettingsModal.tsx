"use client";

import { SectionPageSettingsModal } from "@/components/admin/SectionPageSettingsModal";
import type {
  PhotoGalleryId,
  PhotoGalleryStatus,
} from "@/lib/content/photo-galleries";

type Props = {
  galleryId: PhotoGalleryId;
  initialLabel: string;
  initialDescription: string;
  initialStatus?: PhotoGalleryStatus;
  initialOgImage?: string;
};

/** ヘッダーの「編集」→ ページ設定をモーダルで編集 */
export function PhotoGallerySettingsModal({
  galleryId,
  initialLabel,
  initialDescription,
  initialStatus = "published",
  initialOgImage = "",
}: Props) {
  return (
    <SectionPageSettingsModal
      metaApiPath={`/api/admin/photos/${galleryId}/meta/`}
      initialLabel={initialLabel}
      initialDescription={initialDescription}
      initialStatus={initialStatus}
      initialOgImage={initialOgImage}
      ogUploadKind={`photo-${galleryId}`}
      descriptionHelp="公開ページの ? アイコンにも使います。"
    />
  );
}
