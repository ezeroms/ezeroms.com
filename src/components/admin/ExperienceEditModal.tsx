"use client";

import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  EXPERIENCE_EDITOR_FORM_ID,
  ExperienceEditorForm,
  type ExperienceEditorInitial,
} from "@/components/admin/ExperienceEditorForm";
import {
  deleteAdminItem,
  useAdminEditorModal,
} from "@/components/admin/useAdminEditorModal";

type Props = {
  initial?: ExperienceEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

export function ExperienceEditModal({
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
      url: `/api/admin/experience/${initial.slug}/`,
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
      formId={EXPERIENCE_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
      maxWidthClassName="max-w-3xl"
      maxHeightClassName="max-h-[min(92vh,52rem)]"
    >
      <ExperienceEditorForm
        key={initial?.slug ?? "new"}
        initial={initial ?? undefined}
        hideSubmit
        onSaved={onClose}
        onLoadingChange={setSaving}
        onDirtyChange={setDirty}
      />
    </AdminContentModal>
  );
}
