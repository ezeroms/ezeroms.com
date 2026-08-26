"use client";

import { useEffect, useState } from "react";

export const ADMIN_DELETE_HIDE_CONFIRM =
  "このコンテンツを削除しますか？\n（一覧・公開ページから非表示になります）";

export function useAdminEditorModal(open: boolean) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  return {
    mounted,
    saving,
    setSaving,
    dirty,
    setDirty,
    deleting,
    setDeleting,
    deleteError,
    setDeleteError,
  };
}

export async function deleteAdminItem(input: {
  url: string;
  confirmMessage?: string;
  deleting: boolean;
  setDeleting: (value: boolean) => void;
  setDeleteError: (value: string | null) => void;
  onSuccess: () => void;
}): Promise<void> {
  if (input.deleting) return;
  if (!window.confirm(input.confirmMessage ?? ADMIN_DELETE_HIDE_CONFIRM)) {
    return;
  }

  input.setDeleteError(null);
  input.setDeleting(true);
  try {
    const res = await fetch(input.url, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      input.setDeleteError(data.error || "削除に失敗しました");
      return;
    }
    input.onSuccess();
  } catch {
    input.setDeleteError("削除中に通信エラーが発生しました");
  } finally {
    input.setDeleting(false);
  }
}
