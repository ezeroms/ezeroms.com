"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  WORK_EDITOR_FORM_ID,
  WorkEditorForm,
  type WorkEditorInitial,
} from "@/components/admin/WorkEditorForm";

type Props = {
  initial?: WorkEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

export function WorkEditModal({ initial = null, open, onClose }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.slug);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setDirty(false);
      setDeleting(false);
      setDeleteError(null);
    }
  }, [open]);

  async function onDelete() {
    if (!initial?.slug || deleting) return;
    const ok = window.confirm(
      "このコンテンツを削除しますか？\n（一覧・公開ページから非表示になります）",
    );
    if (!ok) return;

    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/work/${initial.slug}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error || "削除に失敗しました");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setDeleteError("削除中に通信エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  }

  if (!mounted) return null;

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={isEdit ? "コンテンツを編集" : "コンテンツを追加"}
      formId={WORK_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
      maxHeightClassName="max-h-[min(90vh,52rem)]"
    >
      <WorkEditorForm
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
