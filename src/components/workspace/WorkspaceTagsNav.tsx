"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import type { TagNavSection } from "@/lib/workspace/tags";
import { parseWorkspaceTags } from "@/types/workspace";

type Props = {
  sections: TagNavSection[];
  selectedTag: string | null;
  countForTag: (tag: string) => number;
  onSelect: (tag: string) => void;
  onAddTag: (tag: string) => void;
};

export function WorkspaceTagsNav({
  sections,
  selectedTag,
  countForTag,
  onSelect,
  onAddTag,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const showHeaders = sections.some((section) => section.label);

  function commit() {
    const parsed = parseWorkspaceTags([draft])[0];
    setAdding(false);
    setDraft("");
    if (!parsed) return;
    onAddTag(parsed);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    commit();
  }

  return (
    <>
      <div className="mb-1.5 mt-5 flex items-center justify-between gap-2 px-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          タグ
        </p>
        <div className="flex items-center gap-1.5">
          <Link
            href="/admin/workspace/tags/"
            className="border-0 bg-transparent p-0 text-[11px] text-muted-foreground shadow-none transition-colors hover:text-foreground"
          >
            管理
          </Link>
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:text-foreground"
            aria-label="タグを追加"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {adding ? (
          <form className="px-1 pb-1" onSubmit={onSubmit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              placeholder="新しいタグ"
              className="admin-input-bare h-8 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground outline-none"
              autoFocus
              autoComplete="off"
            />
          </form>
        ) : null}
        {sections.map((section) => (
          <div key={section.id ?? "ungrouped"}>
            {showHeaders && section.label ? (
              <p className="mb-1 mt-3 px-2 text-[11px] font-medium text-muted-foreground">
                {section.label}
              </p>
            ) : showHeaders && section.id === null ? (
              <p className="mb-1 mt-3 px-2 text-[11px] font-medium text-muted-foreground">
                無所属
              </p>
            ) : null}
            {section.tags.map((tag) => {
              const active = selectedTag === tag;
              const count = countForTag(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelect(tag)}
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
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
