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
import {
  AdminRichTextEditor,
  type AdminRichTextEditorHandle,
} from "@/components/admin/AdminRichTextEditor";
import { DiaryFocusModeButton } from "@/components/admin/DiaryEditorForm";
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
import { generateContentSlug } from "@/lib/admin/content";

export const COLUMN_EDITOR_FORM_ID = "column-editor-form";


export type ColumnEditorInitial = {
  slug: string;
  title: string;
  body_md: string;
  date: string;
  tags: string;
  status: "published" | "draft";
  og_image: string;
};

export function ColumnEditorForm({
  initial,
  formId = COLUMN_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
  focusMode: focusModeProp,
  onFocusModeChange,
  showInlineFocusToggle = true,
  focusModeToggleRef,
}: {
  initial?: ColumnEditorInitial;
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
    () => initial?.slug || `draft-${generateContentSlug(12)}`,
  );

  const [baseline, setBaseline] = useState(() => ({
    title: initial?.title ?? "",
    bodyMd: initial?.body_md ?? "",
    date: initial?.date
      ? toDatetimeLocalValue(initial.date)
      : nowDatetimeLocalValue(),
    tags: initial?.tags ?? "",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [title, setTitle] = useState(baseline.title);
  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [date, setDate] = useState(baseline.date);
  const [tags, setTags] = useState(baseline.tags);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    title !== baseline.title ||
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
      title !== baseline.title ||
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
        title,
        body_md: markdown,
        date: new Date(date).toISOString(),
        tags,
        og_image: ogImage,
        status,
      };
      const res = await fetch(
        isEdit ? `/api/admin/column/${savedSlug}/` : "/api/admin/column/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
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
        title,
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

  const focusTitle = (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="記事タイトル"
      aria-label="タイトル"
      required
      className="m-0 w-full border-0 bg-transparent p-0 text-[1.65rem] font-semibold leading-snug tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
      {...ignorePasswordManagersProps}
    />
  );

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
        <Label htmlFor="column-title">タイトル</Label>
        <Input
          id="column-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="記事タイトル"
          required
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="column-body">本文</Label>
        {focusMode ? null : (
          <AdminRichTextEditor
            ref={editorRef}
            id="column-body"
            value={bodyMd}
            onChange={setBodyMd}
            disabled={loading}
            placeholder="本文を書く…"
            minHeightClassName="min-h-[280px]"
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

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="column"
        disabled={loading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="column-date">日時</Label>
          <Input
            id="column-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="column-status">ステータス</Label>
          <Select
            id="column-status"
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
        <Label htmlFor="column-tags">タグ（カンマ区切り）</Label>
        <Input
          id="column-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="思考, 日常"
          {...ignorePasswordManagersProps}
        />
      </div>

      {!hideSubmit ? (
        <button type="submit" className="sr-only">
          保存
        </button>
      ) : null}
    </form>
    {focusMode && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[220] flex flex-col border-0 bg-card">
            <AdminRichTextEditor
              ref={editorRef}
              id="column-body-focus"
              value={bodyMd}
              onChange={setBodyMd}
              disabled={loading}
              placeholder="本文を書く…"
              variant="document"
              minHeightClassName="min-h-[12rem]"
              allowVideo
              onUploadImage={uploadBodyImage}
              beforeContent={<div className="pb-3">{focusTitle}</div>}
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
