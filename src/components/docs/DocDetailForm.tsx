"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLinkedItems } from "@/components/workspace/WorkspaceLinkedItems";
import { DOC_STATUS_LABELS } from "@/lib/workspace/labels";
import type {
  DocStatus,
  WorkspaceDoc,
  WorkspaceItemLink,
  WorkspaceProject,
  WorkspaceTask,
} from "@/types/workspace";

type Props = {
  doc: WorkspaceDoc;
  projects: WorkspaceProject[];
  links: WorkspaceItemLink[];
  linkedTasks: WorkspaceTask[];
  allTasks: WorkspaceTask[];
};

export function DocDetailForm({
  doc,
  projects,
  links,
  linkedTasks,
  allTasks,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [bodyMd, setBodyMd] = useState(doc.body_md);
  const [status, setStatus] = useState<DocStatus>(doc.status);
  const [projectId, setProjectId] = useState(doc.project_id ?? "");
  const [newProjectName, setNewProjectName] = useState("");
  const [projectList, setProjectList] = useState(projects);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/workspace/docs/${doc.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body_md: bodyMd,
          status,
          project_id: projectId || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      setMessage("保存しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive() {
    if (busy) return;
    if (!confirm("この Doc をアーカイブしますか？")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/docs/${doc.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "アーカイブに失敗しました");
      router.push("/admin/workspace/docs/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アーカイブに失敗しました");
      setBusy(false);
    }
  }

  async function createProject() {
    const name = newProjectName.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/projects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceProject;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Project 作成に失敗しました");
      if (data.item) {
        setProjectList((prev) => [data.item!, ...prev]);
        setProjectId(data.item.id);
        setNewProjectName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project 作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function createRelatedTask() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "無題の Task",
          status: "inbox",
          project_id: projectId || null,
        }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || "Task 作成に失敗しました");
      }
      const linkRes = await fetch("/api/admin/workspace/links/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_type: "doc",
          from_id: doc.id,
          to_type: "task",
          to_id: data.item.id,
          relation: "created_from",
        }),
      });
      const linkData = (await linkRes.json()) as { error?: string };
      if (!linkRes.ok) {
        throw new Error(linkData.error || "リンク作成に失敗しました");
      }
      router.push(`/admin/workspace/tasks/${data.item.id}/`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task 作成に失敗しました");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doc-title">タイトル</Label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-status">状態</Label>
            <Select
              id="doc-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DocStatus)}
            >
              {Object.entries(DOC_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-project">Project</Label>
            <Select
              id="doc-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">（なし）</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <div className="mt-1 flex gap-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="新しい Project 名"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createProject}
                disabled={busy || !newProjectName.trim()}
              >
                作成
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doc-body">本文（Markdown）</Label>
          <Textarea
            id="doc-body"
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            className="min-h-[280px] font-mono text-sm"
            placeholder="メモを書く…"
          />
        </div>

        {error ? (
          <p className="m-0 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="m-0 text-sm text-emerald-700">{message}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !title.trim()}>
            {busy ? "保存中…" : "保存"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={createRelatedTask}
            disabled={busy}
          >
            関連 Task を作る
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/workspace/docs/">一覧へ</Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onArchive}
            disabled={busy}
          >
            アーカイブ
          </Button>
        </div>
      </form>

      <WorkspaceLinkedItems
        entityType="doc"
        entityId={doc.id}
        initialLinks={links}
        linkedDocs={[]}
        linkedTasks={linkedTasks}
        linkCandidates={{ docs: [], tasks: allTasks }}
      />
    </div>
  );
}
