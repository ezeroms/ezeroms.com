"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PHOTO_EDITOR_FORM_ID,
  PhotoEditorForm,
  type PhotoEditorInitial,
} from "@/components/admin/PhotoEditorForm";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { cn } from "@/lib/cn";

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
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const titleId = useId();
  const isEdit = Boolean(initial?.slug);
  const busy = saving || deleting;
  const canSubmit = dirty && !busy;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, busy]);

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
      const res = await fetch(
        `/api/admin/photos/${galleryId}/${initial.slug}/`,
        { method: "DELETE" },
      );
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

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default appearance-none border-0 bg-transparent p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border-0 bg-card shadow-none",
          "max-h-[min(90vh,44rem)] font-sans text-foreground",
        )}
        {...ignorePasswordManagersProps}
      >
        <div className="shrink-0 border-0 border-b border-solid border-border px-6 py-4">
          <h2
            id={titleId}
            className="m-0 text-lg font-semibold tracking-tight"
          >
            {isEdit ? "コンテンツを編集" : "コンテンツを追加"}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {deleteError ? (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
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
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-0 border-t border-solid border-border px-6 py-4">
          <div className="flex min-w-0 items-center">
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={onDelete}
              >
                {deleting ? "削除中…" : "削除"}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              form={PHOTO_EDITOR_FORM_ID}
              disabled={!canSubmit}
            >
              {saving ? "保存中…" : isEdit ? "更新" : "追加"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.querySelector(".admin-app") ?? document.querySelector(".admin-root") ?? document.body,
  );
}
