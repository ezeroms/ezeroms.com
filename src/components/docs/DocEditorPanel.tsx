"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2 } from "lucide-react";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { DocTagsInput } from "@/components/docs/DocTagsInput";
import { Button } from "@/components/ui/button";
import { ClickToEditField } from "@/components/ui/click-to-edit-field";
import { cn } from "@/lib/cn";
import { parseDocTags, type WorkspaceDoc } from "@/types/workspace";

const AUTOSAVE_MS = 700;

type Draft = {
  title: string;
  body_md: string;
  tags: string[];
};

function draftFromDoc(doc: WorkspaceDoc): Draft {
  return {
    title: doc.title,
    body_md: doc.body_md ?? "",
    tags: parseDocTags(doc.tags),
  };
}

function draftsEqual(a: Draft, b: Draft): boolean {
  return (
    a.title === b.title &&
    a.body_md === b.body_md &&
    a.tags.join("\0") === b.tags.join("\0")
  );
}

type Props = {
  doc: WorkspaceDoc;
  tagSuggestions: string[];
  onSaved: (doc: WorkspaceDoc) => void;
  onArchived: (docId: string) => void;
};

export function DocEditorPanel({
  doc,
  tagSuggestions,
  onSaved,
  onArchived,
}: Props) {
  const [draft, setDraft] = useState(() => draftFromDoc(doc));
  const [baseline, setBaseline] = useState(() => draftFromDoc(doc));
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const docIdRef = useRef(doc.id);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const next = draftFromDoc(doc);
    docIdRef.current = doc.id;
    setDraft(next);
    setBaseline(next);
    setSaveState("idle");
    setError(null);
  }, [doc.id, doc.updated_at]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === "f") {
        event.preventDefault();
        setFocusMode((current) => !current);
        return;
      }
      if (event.key === "Escape" && focusMode) {
        if (document.querySelector("[role='dialog']")) return;
        event.preventDefault();
        setFocusMode(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode]);

  useEffect(() => {
    if (!focusMode) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [focusMode]);

  function patchDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      setSaveState(draftsEqual(next, baseline) ? "saved" : "dirty");
      return next;
    });
  }

  async function persist(current: Draft): Promise<boolean> {
    setSaveState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/admin/workspace/docs/${doc.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title.trim(),
          body_md: current.body_md,
          tags: parseDocTags(current.tags),
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceDoc;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      if (docIdRef.current !== doc.id) return false;
      const savedDraft = draftFromDoc(data.item);
      setBaseline(savedDraft);
      if (draftsEqual(draftRef.current, current)) {
        setDraft(savedDraft);
      }
      setSaveState("saved");
      onSaved(data.item);
      return true;
    } catch (err) {
      if (docIdRef.current !== doc.id) return false;
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSaveState("error");
      return false;
    }
  }

  useEffect(() => {
    if (draftsEqual(draft, baseline)) return;
    const timer = window.setTimeout(() => {
      void persist(draft);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave on draft only
  }, [draft]);

  async function onArchive() {
    if (!confirm("この Doc をアーカイブしますか？")) return;
    try {
      const response = await fetch(`/api/admin/workspace/docs/${doc.id}/`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "アーカイブに失敗しました");
      }
      onArchived(doc.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アーカイブに失敗しました");
    }
  }

  const focusToggle = (
    <button
      type="button"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground"
      aria-label={focusMode ? "集中モードを終了" : "集中モード"}
      aria-pressed={focusMode}
      title={focusMode ? "集中モードを終了（Esc）" : "集中モード（⌘⇧F）"}
      onClick={() => setFocusMode((current) => !current)}
    >
      {focusMode ? (
        <Minimize2 className="size-4" aria-hidden />
      ) : (
        <Maximize2 className="size-4" aria-hidden />
      )}
    </button>
  );

  const titleField = (
    <ClickToEditField
      value={draft.title}
      emptyLabel="タイトル"
      ariaLabel="タイトル"
      displayClassName={cn(
        "font-semibold leading-snug tracking-tight text-foreground",
        focusMode ? "text-[1.65rem]" : "text-[1.15rem]",
      )}
      onSave={async (next) => {
        patchDraft("title", next);
      }}
    />
  );

  const saveStatusLabel =
    saveState === "saving"
      ? "保存中…"
      : saveState === "dirty"
        ? "編集中"
        : saveState === "saved"
          ? "保存済み"
          : saveState === "error"
            ? "エラー"
            : "\u00a0";

  const saveStatusColor =
    saveState === "saved"
      ? "text-muted-foreground/45"
      : saveState === "error"
        ? "text-red-600"
        : "text-muted-foreground";

  const focusEditor = (
    <AdminRichTextEditor
      id={`doc-body-${doc.id}`}
      value={draft.body_md}
      onChange={(markdown) => patchDraft("body_md", markdown)}
      placeholder="本文を書く…"
      variant="document"
      toolbarEnd={
        <>
          <p
            className={cn(
              "m-0 whitespace-nowrap text-[11px] leading-none transition-opacity duration-300",
              saveStatusColor,
              saveState === "idle" && "opacity-0",
            )}
            aria-live="polite"
          >
            {saveStatusLabel}
          </p>
          {focusToggle}
        </>
      }
      beforeContent={
        <div className="pb-3">
          {titleField}
          {error ? (
            <p className="m-0 mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      }
      scrollInnerClassName="mx-auto w-full max-w-3xl px-6 pb-20 pt-8 sm:px-10"
      className="admin-rich-text--focus h-full max-h-none min-h-0 flex-1 !border-0 !rounded-none !shadow-none"
      minHeightClassName="min-h-[12rem]"
    />
  );

  const focusOverlay =
    focusMode && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col border-0 bg-card">
            {focusEditor}
          </div>,
          document.querySelector(".admin-app") ??
            document.querySelector(".admin-root") ??
            document.body,
        )
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {focusOverlay}
      {focusMode ? null : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-5 pb-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">{titleField}</div>
              {focusToggle}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 pb-4 pt-5">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <AdminRichTextEditor
                id={`doc-body-${doc.id}`}
                value={draft.body_md}
                onChange={(markdown) => patchDraft("body_md", markdown)}
                placeholder="本文を書く…"
                className="h-full max-h-none min-h-[12rem] flex-1"
                minHeightClassName="min-h-[12rem]"
              />
            </div>

            <div className="shrink-0">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                タグ
              </p>
              <DocTagsInput
                value={draft.tags}
                suggestions={tagSuggestions}
                onChange={(tags) => patchDraft("tags", tags)}
              />
            </div>

            {error ? (
              <p className="m-0 shrink-0 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-red-200 px-3 text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => void onArchive()}
            >
              アーカイブ
            </Button>
            <p
              className={cn(
                "m-0 text-[11px] transition-opacity duration-300",
                saveStatusColor,
                saveState === "idle" && "opacity-0",
              )}
              aria-live="polite"
            >
              {saveStatusLabel}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
