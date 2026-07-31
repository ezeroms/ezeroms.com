"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { DOC_STATUS_LABELS, formatShortDate } from "@/lib/workspace/labels";
import type { WorkspaceDoc, WorkspaceProject } from "@/types/workspace";

type Props = {
  initialDocs: WorkspaceDoc[];
  projects: WorkspaceProject[];
  initialStatus?: string;
  initialQuery?: string;
};

export function DocsBoard({
  initialDocs,
  projects,
  initialStatus = "",
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [title, setTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [query, setQuery] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectName = (id: string | null) => {
    if (!id) return null;
    return projects.find((p) => p.id === id)?.name ?? null;
  };

  async function reload(nextStatus = statusFilter, nextQ = query) {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set("limit", "200");
      if (nextStatus) sp.set("status", nextStatus);
      if (nextQ.trim()) sp.set("q", nextQ.trim());
      const res = await fetch(`/api/admin/workspace/docs/?${sp.toString()}`);
      const data = (await res.json()) as {
        items?: WorkspaceDoc[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "読み込みに失敗しました");
      setDocs(data.items ?? []);
      const url = new URL("/admin/workspace/docs/", window.location.origin);
      if (nextStatus) url.searchParams.set("status", nextStatus);
      if (nextQ.trim()) url.searchParams.set("q", nextQ.trim());
      router.replace(url.pathname + url.search, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function onQuickAdd(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/docs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, status: "inbox", body_md: "" }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceDoc;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "作成に失敗しました");
      setTitle("");
      if (data.item) {
        router.push(`/admin/workspace/docs/${data.item.id}/`);
        return;
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={onQuickAdd}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="クイックメモのタイトル…"
          className="flex-1"
          autoComplete="off"
          enterKeyHint="go"
        />
        <Button type="submit" disabled={busy || !title.trim()}>
          {busy ? "作成中…" : "作成して開く"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={statusFilter}
          onChange={(e) => {
            const v = e.target.value;
            setStatusFilter(v);
            void reload(v, query);
          }}
          className="sm:w-40"
        >
          <option value="">すべて</option>
          {Object.entries(DOC_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void reload(statusFilter, query);
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・本文を検索…"
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={loading}>
            検索
          </Button>
        </form>
      </div>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {loading ? (
          <li className="px-1 py-6 text-sm text-muted-foreground">読み込み中…</li>
        ) : docs.length === 0 ? (
          <li className="px-1 py-6 text-sm text-muted-foreground">
            Doc はまだありません。上の欄から追加できます。
          </li>
        ) : (
          docs.map((doc) => {
            const pn = projectName(doc.project_id);
            const excerpt = doc.body_md.replace(/\s+/g, " ").trim().slice(0, 120);
            return (
              <li key={doc.id}>
                <Link
                  href={`/admin/workspace/docs/${doc.id}/`}
                  className={cn(
                    "block rounded-md border border-transparent px-1 py-2 no-underline hover:border-border hover:bg-black/[0.02]",
                  )}
                >
                  <div className="text-sm font-medium text-foreground">
                    {doc.title}
                  </div>
                  {excerpt ? (
                    <p className="m-0 mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {excerpt}
                    </p>
                  ) : null}
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    <span>{DOC_STATUS_LABELS[doc.status] ?? doc.status}</span>
                    <span>更新 {formatShortDate(doc.updated_at)}</span>
                    {pn ? <span>{pn}</span> : null}
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
