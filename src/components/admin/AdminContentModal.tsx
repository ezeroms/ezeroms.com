"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  formId?: string;
  isEdit: boolean;
  saving: boolean;
  dirty: boolean;
  deleting?: boolean;
  deleteError?: string | null;
  onDelete?: () => void;
  /** 追加 / 更新 のラベル（デフォルトは「追加」「更新」） */
  createLabel?: string;
  updateLabel?: string;
  cancelLabel?: string;
  /** false で保存ボタンを隠す（クリック編集のオートセーブ用） */
  showSave?: boolean;
  maxWidthClassName?: string;
  maxHeightClassName?: string;
  /** タイトル右（タブなど） */
  headerRight?: ReactNode;
  /**
   * 既定のタイトル行の代わりに使うカスタムヘッダー。
   * 指定時は `title` は aria-label 用に残す。
   */
  header?: ReactNode;
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
  cancelLabel = "キャンセル",
  showSave = true,
  maxWidthClassName = "max-w-2xl",
  maxHeightClassName = "max-h-[min(90vh,44rem)]",
  headerRight,
  header,
  children,
}: Props) {
  const titleId = useId();
  const busy = saving || deleting;
  const canSubmit = Boolean(showSave && formId && dirty && !busy);
  const useCustomHeader = header != null;

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
        aria-labelledby={useCustomHeader ? undefined : titleId}
        aria-label={useCustomHeader ? title : undefined}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden rounded-lg border-0 bg-card shadow-none",
          "font-sans text-foreground",
          maxWidthClassName,
          maxHeightClassName,
        )}
        {...ignorePasswordManagersProps}
      >
        {useCustomHeader ? (
          <div className="shrink-0 border-0 border-b border-solid border-border">
            {header}
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-between gap-3 border-0 border-b border-solid border-border px-6 py-4">
            <h2
              id={titleId}
              className="m-0 min-w-0 truncate text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            {headerRight ? (
              <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
            ) : null}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
              {cancelLabel}
            </Button>
            {showSave && formId ? (
              <Button type="submit" form={formId} disabled={!canSubmit}>
                {saving ? "保存中…" : isEdit ? updateLabel : createLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.querySelector(".admin-app") ??
      document.querySelector(".admin-root") ??
      document.body,
  );
}
