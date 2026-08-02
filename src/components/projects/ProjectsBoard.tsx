"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROJECT_STATUS_LABELS } from "@/lib/workspace/labels";
import type { ProjectStatus, WorkspaceProject } from "@/types/workspace";
import { PROJECT_STATUSES } from "@/types/workspace";

type Props = {
  initialProjects: WorkspaceProject[];
};

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export function ProjectsBoard({ initialProjects }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [newName, setNewName] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialProjects.map((p) => [p.id, p.name])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function syncProject(item: WorkspaceProject) {
    setProjects((list) => {
      const next = list.map((p) => (p.id === item.id ? item : p));
      if (!next.some((p) => p.id === item.id)) return [item, ...list];
      return next;
    });
    setDraftNames((prev) => ({ ...prev, [item.id]: item.name }));
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/workspace/projects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceProject;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "作成に失敗しました");
      }
      setProjects((list) => [data.item!, ...list]);
      setDraftNames((prev) => ({ ...prev, [data.item!.id]: data.item!.name }));
      setNewName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setCreating(false);
    }
  }

  async function saveName(project: WorkspaceProject) {
    const name = (draftNames[project.id] ?? "").trim();
    if (!name) {
      setError("名前は必須です");
      setDraftNames((prev) => ({ ...prev, [project.id]: project.name }));
      return;
    }
    if (name === project.name) return;

    setBusyId(project.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/projects/${project.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const data = (await response.json()) as {
        item?: WorkspaceProject;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      syncProject(data.item);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setDraftNames((prev) => ({ ...prev, [project.id]: project.name }));
    } finally {
      setBusyId(null);
    }
  }

  async function saveStatus(project: WorkspaceProject, status: ProjectStatus) {
    if (status === project.status) return;
    setBusyId(project.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/projects/${project.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = (await response.json()) as {
        item?: WorkspaceProject;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "状態の更新に失敗しました");
      }
      if (data.item.status === "archived") {
        setProjects((list) => list.filter((p) => p.id !== project.id));
      } else {
        syncProject(data.item);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "状態の更新に失敗しました",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function archive(project: WorkspaceProject) {
    if (!confirm(`「${project.name}」をアーカイブしますか？`)) return;
    setBusyId(project.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/projects/${project.id}/`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "アーカイブに失敗しました");
      }
      setProjects((list) => list.filter((p) => p.id !== project.id));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "アーカイブに失敗しました",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="m-0 text-sm font-semibold text-foreground">
          Project を追加
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks / Docs から紐づけられるグループです。名前はあとから変更できます。
        </p>
        <form
          onSubmit={onCreate}
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project 名"
            className="sm:max-w-sm"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={creating || !newName.trim()}
          >
            <FolderPlus className="size-4" aria-hidden />
            {creating ? "作成中…" : "追加"}
          </Button>
        </form>
      </section>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-md border border-border bg-card">
        {projects.length === 0 ? (
          <p className="m-0 px-4 py-10 text-center text-sm text-muted-foreground">
            Project はまだありません
          </p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="w-[140px] px-4 py-3 font-medium">状態</th>
                <th className="w-[120px] px-4 py-3 font-medium">更新日</th>
                <th className="w-[1%] whitespace-nowrap px-4 py-3 font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const busy = busyId === project.id;
                const draft = draftNames[project.id] ?? project.name;
                const dirty = draft.trim() !== project.name;
                return (
                  <tr key={project.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <Input
                          value={draft}
                          disabled={busy}
                          onChange={(e) =>
                            setDraftNames((prev) => ({
                              ...prev,
                              [project.id]: e.target.value,
                            }))
                          }
                          onBlur={() => void saveName(project)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                            }
                            if (e.key === "Escape") {
                              setDraftNames((prev) => ({
                                ...prev,
                                [project.id]: project.name,
                              }));
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="h-9 max-w-md border-border bg-card"
                          aria-label={`${project.name} の名前`}
                        />
                        {dirty ? (
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            未保存
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Select
                        value={project.status}
                        disabled={busy}
                        onChange={(e) =>
                          void saveStatus(
                            project,
                            e.target.value as ProjectStatus,
                          )
                        }
                        className="h-9 border-border bg-card"
                      >
                        {PROJECT_STATUSES.filter((s) => s !== "archived").map(
                          (status) => (
                            <option key={status} value={status}>
                              {PROJECT_STATUS_LABELS[status] ?? status}
                            </option>
                          ),
                        )}
                      </Select>
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      {formatUpdatedAt(project.updated_at)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          asChild
                        >
                          <Link
                            href={`/admin/workspace/tasks/?project=${project.id}`}
                          >
                            Tasks
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          disabled={busy}
                          onClick={() => void archive(project)}
                        >
                          アーカイブ
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}