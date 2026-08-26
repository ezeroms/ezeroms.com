"use client";

import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  GIANTS_EDITOR_FORM_ID,
  GiantsEditorForm,
  type GiantsEditorInitial,
} from "@/components/admin/GiantsEditorForm";
import {
  deleteAdminItem,
  useAdminEditorModal,
} from "@/components/admin/useAdminEditorModal";

type Props = {
  initial?: GiantsEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

export function GiantsEditModal({ initial = null, open, onClose }: Props) {
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
      url: `/api/admin/giants/${initial.slug}/`,
      confirmMessage:
        "このエントリを削除しますか？\n（一覧・公開ページから削除されます）",
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
      title={isEdit ? "Giants を編集" : "Giants を追加"}
      formId={GIANTS_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
      createLabel="追加"
      updateLabel="更新"
    >
      <GiantsEditorForm
        key={initial?.slug ?? "new"}
        initial={initial ?? undefined}
        hideSubmit
        onLoadingChange={setSaving}
        onDirtyChange={setDirty}
        onSaved={onClose}
      />
    </AdminContentModal>
  );
}
