"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { DocEditorPanel } from "@/components/docs/DocEditorPanel";
import { Button } from "@/components/ui/button";
import { TagBoardCrossLink } from "@/components/workspace/TagBoardCrossLink";
import { WorkspaceTagsNav } from "@/components/workspace/WorkspaceTagsNav";
import { cn } from "@/lib/cn";
import { cardOutlineClass } from "@/lib/site/card-styles";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import {
  countDocsForTag,
  docsBoardSelectionTitle,
  filterDocsForBoard,
  type DocsNavSelection,
} from "@/lib/workspace/doc-views";
import {
  groupTagsForNav,
  isArchivedDoc,
  orderedTagNames,
  sidebarTagsForItems,
  uniqueWorkspaceTags,
} from "@/lib/workspace/tags";
import {
  parseWorkspaceTags,
  type WorkspaceDoc,
  type WorkspaceTag,
  type WorkspaceTagGroup,
  type WorkspaceTask,
} from "@/types/workspace";

export type { DocsNavSelection };

type Props = {
  initialDocs: WorkspaceDoc[];
  initialTasks: WorkspaceTask[];
  initialTagGroups?: WorkspaceTagGroup[];
  initialCatalogTags?: WorkspaceTag[];
  initialSelection: DocsNavSelection;
  initialDocId?: string | null;
};

export function DocsBoard({
  initialDocs,
  initialTasks,
  initialTagGroups = [],
  initialCatalogTags = [],
  initialSelection,
  initialDocId = null,
}: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [tasks] = useState(initialTasks);
  const [selection, setSelection] =
    useState<DocsNavSelection>(initialSelection);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialDocId,
  );
  const [quickTitle, setQuickTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveDocs = useMemo(
    () => docs.filter((doc) => !isArchivedDoc(doc)),
    [docs],
  );

  const knownTags = useMemo(
    () =>
      groupTagsForNav(
        sidebarTagsForItems(docs),
        initialCatalogTags,
        initialTagGroups,
      ),
    [docs, initialCatalogTags, initialTagGroups],
  );

  const tagSuggestions = useMemo(() => {
    const ordered = orderedTagNames(initialCatalogTags, initialTagGroups);
    const extras = uniqueWorkspaceTags(docs, tasks).filter(
      (tag) => !ordered.includes(tag),
    );
    return [...ordered, ...extras];
  }, [docs, tasks, initialCatalogTags, initialTagGroups]);

  const visibleDocs = useMemo(
    () => filterDocsForBoard(liveDocs, selection),
    [liveDocs, selection],
  );

  const selectedDoc = useMemo(
    () => liveDocs.find((doc) => doc.id === selectedDocId) ?? null,
    [liveDocs, selectedDocId],
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

  function addTag(tag: string) {
    const parsed = parseWorkspaceTags([tag])[0];
    if (!parsed) return;
    selectNav({ kind: "tag", tag: parsed });
  }

  async function onQuickAdd(event: FormEvent) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const tags =
        selection.kind === "tag" ? parseWorkspaceTags([selection.tag]) : [];
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
              {liveDocs.length > 0 ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {liveDocs.length}
                </span>
              ) : null}
            </button>
          </nav>

          <WorkspaceTagsNav
            sections={knownTags}
            selectedTag={selection.kind === "tag" ? selection.tag : null}
            countForTag={(tag) => countDocsForTag(liveDocs, tag)}
            onSelect={(tag) => selectNav({ kind: "tag", tag })}
            onAddTag={addTag}
          />
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
              {selection.kind === "tag" ? (
                <TagBoardCrossLink
                  tag={selection.tag}
                  docs={docs}
                  tasks={tasks}
                  current="docs"
                />
              ) : null}
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
                tagSuggestions={tagSuggestions}
                onSaved={(saved) => {
                  setDocs((previous) =>
                    previous.map((item) =>
                      item.id === saved.id ? saved : item,
                    ),
                  );
                }}
                onArchived={(docId) => {
                  setDocs((previous) =>
                    previous.map((item) =>
                      item.id === docId
                        ? {
                            ...item,
                            status: "archived",
                            archived_at: item.archived_at ?? new Date().toISOString(),
                          }
                        : item,
                    ),
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
