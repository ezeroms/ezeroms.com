"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  WORKS_SECTION_META_FORM_ID,
  WorksSectionMetaForm,
  type SectionPublishStatus,
} from "@/components/admin/WorksSectionMetaForm";
import { cn } from "@/lib/cn";

type Props = {
  metaApiPath: string;
  initialLabel: string;
  initialStatus?: SectionPublishStatus;
  initialOgImage?: string;
  ogUploadKind?: string;
};

/** ヘッダーの「編集」→ ページ設定をモーダルで編集（Works / Library / Writing 共通） */
export function WorksSectionSettingsModal({
  metaApiPath,
  initialLabel,
  initialStatus = "published",
  initialOgImage = "",
  ogUploadKind = "section",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSaving(false);
  }, [open]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        編集
      </Button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                aria-label="閉じる"
                className="absolute inset-0 m-0 cursor-default appearance-none border-0 bg-transparent p-0"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
                onClick={() => setOpen(false)}
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-lg border-0 bg-card shadow-none",
                  "max-h-[min(90vh,44rem)] font-sans text-foreground",
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
                    ページ設定
                  </h2>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <WorksSectionMetaForm
                    metaApiPath={metaApiPath}
                    initialLabel={initialLabel}
                    initialStatus={initialStatus}
                    initialOgImage={initialOgImage}
                    ogUploadKind={ogUploadKind}
                    hideSubmit
                    onLoadingChange={setSaving}
                    onSaved={() => setOpen(false)}
                  />
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-0 border-t border-solid border-border px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    form={WORKS_SECTION_META_FORM_ID}
                    disabled={saving}
                  >
                    {saving ? "保存中…" : "設定を保存"}
                  </Button>
                </div>
              </div>
            </div>,
            document.querySelector(".admin-root") ?? document.body,
          )
        : null}
    </>
  );
}
