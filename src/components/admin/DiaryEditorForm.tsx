"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  AdminRichTextEditor,
  type AdminRichTextEditorHandle,
} from "@/components/admin/AdminRichTextEditor";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { uploadBodyMedia } from "@/lib/media/upload-body-media";
import {
  nowDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function draftMediaFolderId(length = 12) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return `draft-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

export const DIARY_EDITOR_FORM_ID = "diary-editor-form";

export function DiaryFocusModeButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground"
      aria-label={active ? "集中モードを終了" : "集中モード"}
      aria-pressed={active}
      title={active ? "集中モードを終了（Esc）" : "集中モード（⌘⇧F）"}
      onClick={onClick}
    >
      {active ? (
        <Minimize2 className="size-4" aria-hidden />
      ) : (
        <Maximize2 className="size-4" aria-hidden />
      )}
    </button>
  );
}


export type DiaryEditorInitial = {
  slug: string;
  body_md: string;
  date: string;
  tags: string;
  status: "published" | "draft";
  og_image: string;
};

export function DiaryEditorForm({
  initial,
  formId = DIARY_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
  focusMode: focusModeProp,
  onFocusModeChange,
  showInlineFocusToggle = true,
  focusModeToggleRef,
}: {
  initial?: DiaryEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  focusMode?: boolean;
  onFocusModeChange?: (next: boolean) => void;
  showInlineFocusToggle?: boolean;
  focusModeToggleRef?: MutableRefObject<(() => void) | null>;
}) {
  const router = useRouter();
  const editorRef = useRef<AdminRichTextEditorHandle>(null);
  const [internalFocusMode, setInternalFocusMode] = useState(false);
  const focusMode = focusModeProp ?? internalFocusMode;
  const [savedSlug, setSavedSlug] = useState(initial?.slug ?? "");
  const isEdit = Boolean(savedSlug);

  const [mediaFolder] = useState(
    () => initial?.slug || draftMediaFolderId(),
  );

  const [baseline, setBaseline] = useState(() => ({
    bodyMd: initial?.body_md ?? "",
    date: initial?.date
      ? toDatetimeLocalValue(initial.date)
      : nowDatetimeLocalValue(),
    tags: initial?.tags ?? "",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "draft") as "published" | "draft",
  }));

  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [date, setDate] = useState(baseline.date);
  const [tags, setTags] = useState(baseline.tags);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    bodyMd !== baseline.bodyMd ||
    date !== baseline.date ||
    tags !== baseline.tags ||
    ogImage !== baseline.ogImage ||
    status !== baseline.status;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function setFocusMode(next: boolean) {
    const latest = editorRef.current?.getMarkdown();
    if (latest != null) setBodyMd(latest);
    if (onFocusModeChange) onFocusModeChange(next);
    else setInternalFocusMode(next);
  }

  function toggleFocusMode() {
    setFocusMode(!focusMode);
  }

  useEffect(() => {
    if (!focusModeToggleRef) return;
    focusModeToggleRef.current = toggleFocusMode;
    return () => {
      if (focusModeToggleRef.current === toggleFocusMode) {
        focusModeToggleRef.current = null;
      }
    };
  }, [focusModeToggleRef, focusMode, onFocusModeChange]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === "f") {
        event.preventDefault();
        toggleFocusMode();
        return;
      }
      if (event.key === "Escape" && focusMode) {
        event.preventDefault();
        event.stopPropagation();
        setFocusMode(false);
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toggle uses latest focusMode via closure
  }, [focusMode, onFocusModeChange]);

  useEffect(() => {
    if (!focusMode) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [focusMode]);

  async function uploadBodyImage(file: File): Promise<string | null> {
    const result = await uploadBodyMedia(file, mediaFolder);
    if ("error" in result) {
      setError(result.error);
      return null;
    }
    setError(null);
    return result.url;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const markdown = editorRef.current?.getMarkdown() ?? bodyMd;
    if (markdown !== bodyMd) setBodyMd(markdown);
    const nextDirty =
      markdown !== baseline.bodyMd ||
      date !== baseline.date ||
      tags !== baseline.tags ||
      ogImage !== baseline.ogImage ||
      status !== baseline.status;
    if (!nextDirty) return;
    if (!markdown.trim()) {
      setError("本文を入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        body_md: markdown,
        date: new Date(date).toISOString(),
        tags,
        og_image: ogImage,
        status,
      };
      const url = isEdit
        ? `/api/admin/diary/${savedSlug}/`
        : "/api/admin/diary/";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        item?: { slug: string };
      };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      if (data.item?.slug) setSavedSlug(data.item.slug);
      setBaseline({
        bodyMd: markdown,
        date,
        tags,
        ogImage,
        status,
      });
      router.refresh();
      if (!focusMode) onSaved?.();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      {...ignorePasswordManagersProps}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="note-body">本文</Label>
        {focusMode ? null : (
          <AdminRichTextEditor
            ref={editorRef}
            id="note-body"
            value={bodyMd}
            onChange={setBodyMd}
            disabled={loading}
            placeholder="今日あったこと、考えたこと…"
            minHeightClassName="min-h-[240px]"
            allowVideo
            onUploadImage={uploadBodyImage}
            toolbarEnd={
              showInlineFocusToggle ? (
                <DiaryFocusModeButton
                  active={false}
                  onClick={toggleFocusMode}
                />
              ) : undefined
            }
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-date">日時</Label>
          <Input
            id="note-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-status">ステータス</Label>
          <Select
            id="note-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "draft" ? "draft" : "published")
            }
            {...ignorePasswordManagersProps}
          >
            <option value="published">公開</option>
            <option value="draft">非公開</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-tags">タグ（カンマ区切り）</Label>
        <Input
          id="note-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="散歩, 音楽"
          {...ignorePasswordManagersProps}
        />
      </div>

      <OgImageField
        id="note-og-image"
        value={ogImage}
        onChange={setOgImage}
        uploadKind="diary"
        disabled={loading}
      />

      {!hideSubmit ? (
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading || !dirty}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-solid border-border bg-card px-4 text-sm font-medium text-foreground shadow-none hover:border-border-hover disabled:cursor-default disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "保存中…" : isEdit ? "更新" : "追加"}
          </button>
        </div>
      ) : null}
    </form>
    {focusMode && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[220] flex flex-col border-0 bg-card">
            <AdminRichTextEditor
              ref={editorRef}
              id="note-body-focus"
              value={bodyMd}
              onChange={setBodyMd}
              disabled={loading}
              placeholder="今日あったこと、考えたこと…"
              variant="document"
              minHeightClassName="min-h-[12rem]"
              allowVideo
              onUploadImage={uploadBodyImage}
              scrollInnerClassName="mx-auto w-full max-w-3xl px-6 pb-20 pt-8 sm:px-10"
              className="admin-rich-text--focus h-full max-h-none min-h-0 flex-1 !border-0 !rounded-none !shadow-none"
              toolbarEnd={
                <>
                  <Button
                    type="submit"
                    form={formId}
                    size="sm"
                    disabled={loading || !dirty}
                  >
                    {loading ? "保存中…" : isEdit ? "更新" : "追加"}
                  </Button>
                  <DiaryFocusModeButton active onClick={toggleFocusMode} />
                </>
              }
            />
          </div>,
          document.querySelector(".admin-app") ??
            document.querySelector(".admin-root") ??
            document.body,
        )
      : null}
    </>
  );
}
