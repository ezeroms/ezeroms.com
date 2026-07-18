"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  formId: string;
  isEdit: boolean;
  saving: boolean;
  dirty: boolean;
  deleting?: boolean;
  deleteError?: string | null;
  onDelete?: () => void;
  /** 追加 / 更新 のラベル（デフォルトは「追加」「更新」） */
  createLabel?: string;
  updateLabel?: string;
  maxWidthClassName?: string;
  maxHeightClassName?: string;
  children: ReactNode;
};

/**
 * Photos 編集モーダルと同型の CRUD ダイアログ。
 * フッター: 左=削除（編集時） / 右=キャンセル + 追加|更新（dirty 時のみ有効）
 */
export function AdminContentModal({
  open,
  onClose,
  title,
  formId,
  isEdit,
  saving,
  dirty,
  deleting = false,
  deleteError = null,
  onDelete,
  createLabel = "追加",
  updateLabel = "更新",
  maxWidthClassName = "max-w-2xl",
  maxHeightClassName = "max-h-[min(90vh,44rem)]",
  children,
}: Props) {
  const titleId = useId();
  const busy = saving || deleting;
  const canSubmit = dirty && !busy;

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

  if (typeof document === "undefined" || !open) return null;

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
          "relative z-10 flex w-full flex-col overflow-hidden rounded-lg border-0 bg-card shadow-none",
          "font-sans text-foreground",
          maxWidthClassName,
          maxHeightClassName,
        )}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
      >
        <div className="shrink-0 border-0 border-b border-solid border-border px-6 py-4">
          <h2
            id={titleId}
            className="m-0 text-lg font-semibold tracking-tight"
          >
            {title}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {deleteError ? (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          {children}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-0 border-t border-solid border-border px-6 py-4">
          <div className="flex min-w-0 items-center">
            {isEdit && onDelete ? (
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
            <Button type="submit" form={formId} disabled={!canSubmit}>
              {saving ? "保存中…" : isEdit ? updateLabel : createLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.querySelector(".admin-root") ?? document.body,
  );
}
