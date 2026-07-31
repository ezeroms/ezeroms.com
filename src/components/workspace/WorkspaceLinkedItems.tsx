"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  WorkspaceDoc,
  WorkspaceItemLink,
  WorkspaceTask,
} from "@/types/workspace";

type Props = {
  entityType: "doc" | "task";
  entityId: string;
  initialLinks: WorkspaceItemLink[];
  linkedDocs: WorkspaceDoc[];
  linkedTasks: WorkspaceTask[];
  linkCandidates: {
    docs: WorkspaceDoc[];
    tasks: WorkspaceTask[];
  };
};

export function WorkspaceLinkedItems({
  entityType,
  entityId,
  initialLinks,
  linkedDocs,
  linkedTasks,
  linkCandidates,
}: Props) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [docs, setDocs] = useState(linkedDocs);
  const [tasks, setTasks] = useState(linkedTasks);
  const [pickId, setPickId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedDocIds = new Set(docs.map((d) => d.id));
  const linkedTaskIds = new Set(tasks.map((t) => t.id));

  const candidateDocs = linkCandidates.docs.filter((d) => !linkedDocIds.has(d.id));
  const candidateTasks = linkCandidates.tasks.filter(
    (t) => !linkedTaskIds.has(t.id),
  );

  async function addLink() {
    if (!pickId || busy) return;
    const isDocTarget = entityType === "task";
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/links/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_type: entityType,
          from_id: entityId,
          to_type: isDocTarget ? "doc" : "task",
          to_id: pickId,
          relation: "related",
        }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceItemLink;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || "リンクに失敗しました");
      }
      setLinks((prev) => [data.item!, ...prev]);
      if (isDocTarget) {
        const doc = linkCandidates.docs.find((d) => d.id === pickId);
        if (doc) setDocs((prev) => [doc, ...prev]);
      } else {
        const task = linkCandidates.tasks.find((t) => t.id === pickId);
        if (task) setTasks((prev) => [task, ...prev]);
      }
      setPickId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "リンクに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(link: WorkspaceItemLink) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/links/${link.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "解除に失敗しました");
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      const otherId =
        link.from_id === entityId ? link.to_id : link.from_id;
      const otherType =
        link.from_id === entityId ? link.to_type : link.from_type;
      if (otherType === "doc") {
        setDocs((prev) => prev.filter((d) => d.id !== otherId));
      } else if (otherType === "task") {
        setTasks((prev) => prev.filter((t) => t.id !== otherId));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "解除に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  function linkForTarget(type: "doc" | "task", id: string) {
    return links.find(
      (l) =>
        (l.from_type === type && l.from_id === id) ||
        (l.to_type === type && l.to_id === id),
    );
  }

  const pickOptions =
    entityType === "task"
      ? candidateDocs.map((d) => ({ id: d.id, label: d.title }))
      : candidateTasks.map((t) => ({ id: t.id, label: t.title }));

  return (
    <section className="border-t border-border pt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        関連
      </h2>

      <ul className="m-0 mb-4 flex list-none flex-col gap-1 p-0">
        {docs.map((d) => {
          const link = linkForTarget("doc", d.id);
          return (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <Link
                href={`/admin/workspace/docs/${d.id}/`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-foreground no-underline hover:underline"
              >
                Doc · {d.title}
              </Link>
              {link ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(link)}
                  disabled={busy}
                >
                  解除
                </Button>
              ) : null}
            </li>
          );
        })}
        {tasks.map((t) => {
          const link = linkForTarget("task", t.id);
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <Link
                href={`/admin/workspace/tasks/${t.id}/`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-foreground no-underline hover:underline"
              >
                Task · {t.title}
              </Link>
              {link ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(link)}
                  disabled={busy}
                >
                  解除
                </Button>
              ) : null}
            </li>
          );
        })}
        {docs.length === 0 && tasks.length === 0 ? (
          <li className="text-sm text-muted-foreground">関連項目はまだありません。</li>
        ) : null}
      </ul>

      {pickOptions.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="link-pick">
              {entityType === "task" ? "Doc をリンク" : "Task をリンク"}
            </Label>
            <Select
              id="link-pick"
              value={pickId}
              onChange={(e) => setPickId(e.target.value)}
            >
              <option value="">選択…</option>
              {pickOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addLink}
            disabled={busy || !pickId}
          >
            リンク
          </Button>
        </div>
      ) : (
        <p className="m-0 text-xs text-muted-foreground">
          リンクできる候補がありません。先に{" "}
          {entityType === "task" ? "Docs" : "Tasks"} を作成してください。
        </p>
      )}

      {error ? (
        <p className="mt-2 m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
