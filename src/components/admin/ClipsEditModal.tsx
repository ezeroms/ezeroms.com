"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  CLIPS_EDITOR_FORM_ID,
  ClipsEditorForm,
  type ClipsEditorInitial,
} from "@/components/admin/ClipsEditorForm";

type Props = {
  initial?: ClipsEditorInitial | null;
  open: boolean;
  onClose: () => void;
};

export function ClipsEditModal({ initial = null, open, onClose }: Props) {
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
      "このクリップを削除しますか？\n（一覧・公開ページから削除されます）",
    );
    if (!ok) return;

    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clips/${initial.slug}/`, {
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
      title={isEdit ? "クリップを編集" : "クリップを追加"}
      formId={CLIPS_EDITOR_FORM_ID}
      isEdit={isEdit}
      saving={saving}
      dirty={dirty}
      deleting={deleting}
      deleteError={deleteError}
      onDelete={isEdit ? onDelete : undefined}
      createLabel="追加"
      updateLabel="更新"
    >
      <ClipsEditorForm
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
