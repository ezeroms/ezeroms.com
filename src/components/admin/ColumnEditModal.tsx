"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  COLUMN_EDITOR_FORM_ID,
  ColumnEditorForm,
  type ColumnEditorInitial,
} from "@/components/admin/ColumnEditorForm";
import { DiaryFocusModeButton } from "@/components/admin/DiaryEditorForm";
import {
  deleteAdminItem,
  useAdminEditorModal,
} from "@/components/admin/useAdminEditorModal";

type Props = {
  initial?: ColumnEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

export function ColumnEditModal({ initial = null, open, onClose }: Props) {
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
  const [focusMode, setFocusMode] = useState(false);
  const focusModeToggleRef = useRef<(() => void) | null>(null);
  const isEdit = Boolean(initial?.slug);

  useEffect(() => {
    if (!open) setFocusMode(false);
  }, [open]);

  async function onDelete() {
    if (!initial?.slug) return;
    await deleteAdminItem({
      url: `/api/admin/column/${initial.slug}/`,
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
      formId={COLUMN_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
      closeOnEscape={!focusMode}
      headerRight={
        <DiaryFocusModeButton
          active={focusMode}
          onClick={() => focusModeToggleRef.current?.()}
        />
      }
    >
      <ColumnEditorForm
        key={initial?.slug ?? "new"}
        initial={initial ?? undefined}
        hideSubmit
        onLoadingChange={setSaving}
        onDirtyChange={setDirty}
        onSaved={onClose}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
        showInlineFocusToggle={false}
        focusModeToggleRef={focusModeToggleRef}
      />
    </AdminContentModal>
  );
}
