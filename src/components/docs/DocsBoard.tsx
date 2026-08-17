"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Tag } from "lucide-react";
import { DocEditorPanel } from "@/components/docs/DocEditorPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cardOutlineClass } from "@/lib/site/card-styles";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import {
  countDocsForTag,
  docsBoardSelectionTitle,
  filterDocsForBoard,
  uniqueDocTags,
  type DocsNavSelection,
} from "@/lib/workspace/doc-views";
import { parseDocTags, type WorkspaceDoc } from "@/types/workspace";

export type { DocsNavSelection };

type Props = {
  initialDocs: WorkspaceDoc[];
  initialSelection: DocsNavSelection;
  initialDocId?: string | null;
};

export function DocsBoard({
  initialDocs,
  initialSelection,
  initialDocId = null,
}: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [selection, setSelection] =
    useState<DocsNavSelection>(initialSelection);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialDocId,
  );
  const [extraTags, setExtraTags] = useState<string[]>(() =>
    initialSelection.kind === "tag" &&
    !uniqueDocTags(initialDocs).includes(initialSelection.tag)
      ? [initialSelection.tag]
      : [],
  );
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const knownTags = useMemo(() => {
    const fromDocs = uniqueDocTags(docs);
    const extras = extraTags.filter((tag) => !fromDocs.includes(tag));
    return [...fromDocs, ...extras];
  }, [docs, extraTags]);

  const visibleDocs = useMemo(
    () => filterDocsForBoard(docs, selection),
    [docs, selection],
  );

  const selectedDoc = useMemo(
    () => docs.find((doc) => doc.id === selectedDocId) ?? null,
    [docs, selectedDocId],
  );

  useEffect(() => {
    if (
      selectedDocId &&
      visibleDocs.some((doc) => doc.id === selectedDocId)
    ) {
      return;
    }
    setSelectedDocId(visibleDocs[0]?.id ?? null);
  }, [selection, visibleDocs, selectedDocId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selection.kind === "tag") params.set("tag", selection.tag);
    if (selectedDocId) params.set("doc", selectedDocId);
    const query = params.toString();
    router.replace(
      query ? `/admin/workspace/docs/?${query}` : "/admin/workspace/docs/",
      { scroll: false },
    );
  }, [selection, selectedDocId, router]);

  function selectNav(next: DocsNavSelection) {
    setSelection(next);
    setError(null);
  }

  function commitNewTag() {
    const tag = newTag.trim();
    if (!tag) {
      setAddingTag(false);
      setNewTag("");
      return;
    }
    const parsed = parseDocTags([tag])[0];
    if (!parsed) return;
    setExtraTags((prev) => (prev.includes(parsed) ? prev : [...prev, parsed]));
    selectNav({ kind: "tag", tag: parsed });
    setAddingTag(false);
    setNewTag("");
  }

  async function onQuickAdd(event: FormEvent) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const tags =
        selection.kind === "tag" ? parseDocTags([selection.tag]) : [];
      const response = await fetch("/api/admin/workspace/docs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status: "inbox",
          body_md: "",
          tags,
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceDoc;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "作成に失敗しました");
      }
      setQuickTitle("");
      setDocs((previous) => [data.item!, ...previous]);
      setSelectedDocId(data.item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const listTitle = docsBoardSelectionTitle(selection);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
      <aside className="flex max-h-[40%] w-full shrink-0 flex-col border-b border-border bg-background lg:max-h-none lg:w-56 lg:border-b-0 lg:border-r">
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
          <nav className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => selectNav({ kind: "all" })}
              className={sidebarNavItemClass(selection.kind === "all")}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 flex-1 truncate">すべて</span>
              {docs.length > 0 ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {docs.length}
                </span>
              ) : null}
            </button>
          </nav>

          <div className="mb-1.5 mt-5 flex items-center justify-between gap-2 px-2">
            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              タグ
            </p>
            <button
              type="button"
              className="inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:text-foreground"
              aria-label="タグを追加"
              onClick={() => setAddingTag(true)}
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>
          <nav className="flex flex-col gap-0.5">
            {addingTag ? (
              <form
                className="px-1 pb-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  commitNewTag();
                }}
              >
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onBlur={commitNewTag}
                  placeholder="新しいタグ"
                  className="admin-input-bare h-8 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground outline-none"
                  autoFocus
                  autoComplete="off"
                />
              </form>
            ) : null}
            {knownTags.length === 0 && !addingTag ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                まだありません
              </p>
            ) : (
              knownTags.map((tag) => {
                const active =
                  selection.kind === "tag" && selection.tag === tag;
                const count = countDocsForTag(docs, tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => selectNav({ kind: "tag", tag })}
                    className={sidebarNavItemClass(active)}
                  >
                    <Tag className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{tag}</span>
                    {count > 0 ? (
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 basis-0 flex-col p-3 sm:p-4">
        <div
          className={cn(
            "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-card lg:flex-row",
            cardOutlineClass,
          )}
        >
          <section className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col lg:max-w-[22rem] lg:flex-none lg:basis-[22rem] xl:max-w-[24rem] xl:basis-[24rem]">
            <div className="shrink-0 px-5 pb-3 pt-6">
              <h1 className="m-0 text-[1.35rem] font-semibold tracking-tight text-foreground">
                {listTitle}
              </h1>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                {visibleDocs.length} 件
              </p>
            </div>

            <form
              onSubmit={onQuickAdd}
              className="mx-5 mb-3 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors focus-within:border-border-hover"
            >
              <Plus
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Doc を追加…"
                className="admin-input-bare h-8 min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/65"
                autoComplete="off"
                enterKeyHint="done"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={busy}
                className="h-8 shrink-0 px-3"
              >
                {busy ? "…" : "追加"}
              </Button>
            </form>

            {error ? (
              <p
                className="m-0 shrink-0 px-5 py-2 text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <ul className="m-0 min-h-0 flex-1 list-none space-y-1 overflow-y-auto px-3 pb-5 pt-1">
              {visibleDocs.length === 0 ? (
                <li className="px-3 py-20 text-center text-sm text-muted-foreground">
                  Doc はありません
                </li>
              ) : (
                visibleDocs.map((doc) => {
                  const active = doc.id === selectedDocId;
                  return (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedDocId(doc.id)}
                        className={cn(
                          "flex w-full items-start rounded-lg border-0 bg-transparent px-3 py-2.5 text-left shadow-none outline-none transition-colors duration-150 focus-visible:outline-none",
                          active ? "bg-accent" : "hover:bg-muted/60",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-sm font-medium leading-snug",
                            doc.title.trim()
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {doc.title.trim() || "無題"}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <div
            className="h-px w-full shrink-0 bg-border lg:h-auto lg:w-px lg:self-stretch"
            aria-hidden
          />

          <section className="flex min-h-[42%] w-full min-w-0 flex-1 basis-0 flex-col lg:min-h-0">
            {selectedDoc ? (
              <DocEditorPanel
                key={selectedDoc.id}
                doc={selectedDoc}
                tagSuggestions={knownTags}
                onSaved={(saved) => {
                  setDocs((previous) =>
                    previous.map((item) =>
                      item.id === saved.id ? saved : item,
                    ),
                  );
                }}
                onArchived={(docId) => {
                  setDocs((previous) =>
                    previous.filter((item) => item.id !== docId),
                  );
                  setSelectedDocId(null);
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
                <FileText
                  className="size-8 text-muted-foreground/35"
                  aria-hidden
                />
                <p className="m-0 text-sm text-muted-foreground">
                  Doc を選ぶと、ここで編集できます
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
