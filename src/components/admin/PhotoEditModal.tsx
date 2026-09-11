"use client";

import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  PHOTO_EDITOR_FORM_ID,
  PhotoEditorForm,
  type PhotoEditorInitial,
} from "@/components/admin/PhotoEditorForm";
import {
  deleteAdminItem,
  useAdminEditorModal,
} from "@/components/admin/useAdminEditorModal";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";

type Props = {
  galleryId: PhotoGalleryId;
  /** あるとき編集、ないとき新規追加 */
  initial?: PhotoEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

/** 写真の新規追加 / 編集モーダル */
export function PhotoEditModal({
  galleryId,
  initial = null,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const {
    mounted,
    saving,
    setSaving,
    dirty,
    setDirty,
    deleting,
    setDeleting,
    deleteError,
    setDeleteError,
  } = useAdminEditorModal(open);
  const isEdit = Boolean(initial?.slug);

  async function onDelete() {
    if (!initial?.slug) return;
    await deleteAdminItem({
      url: `/api/admin/photos/${galleryId}/${initial.slug}/`,
      deleting,
      setDeleting,
      setDeleteError,
      onSuccess: () => {
        onClose();
        router.refresh();
      },
    });
  }

  if (!mounted) return null;

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={isEdit ? "コンテンツを編集" : "コンテンツを追加"}
      formId={PHOTO_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
    >
      <PhotoEditorForm
        key={initial?.slug ?? "new"}
        galleryId={galleryId}
        initial={initial ?? undefined}
        hideSubmit
        hideBackLink
        onLoadingChange={setSaving}
        onDirtyChange={setDirty}
        onSaved={onClose}
      />
    </AdminContentModal>
  );
}
