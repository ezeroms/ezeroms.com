"use client";

import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  TOP_IMAGE_EDITOR_FORM_ID,
  TopImageEditorForm,
  type TopImageEditorInitial,
} from "@/components/admin/TopImageEditorForm";
import {
  deleteAdminItem,
  useAdminEditorModal,
} from "@/components/admin/useAdminEditorModal";

type Props = {
  initial?: TopImageEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

export function TopImageEditModal({
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
      url: `/api/admin/top-images/${initial.slug}/`,
      confirmMessage:
        "このコンテンツを削除しますか？\n（一覧・トップページから非表示になります）",
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
      formId={TOP_IMAGE_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
    >
      <TopImageEditorForm
        key={initial?.slug ?? "new"}
        initial={initial ?? undefined}
        onLoadingChange={setSaving}
        onDirtyChange={setDirty}
        onSaved={onClose}
      />
    </AdminContentModal>
  );
}
