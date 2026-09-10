"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminSection } from "@/components/admin/AdminSection";
import type { WorkspaceTag, WorkspaceTagGroup } from "@/types/workspace";

type Catalog = {
  groups: WorkspaceTagGroup[];
  tags: WorkspaceTag[];
};

type Props = {
  initialGroups: WorkspaceTagGroup[];
  initialTags: WorkspaceTag[];
};

export function TagsManageBoard({ initialGroups, initialTags }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [tags, setTags] = useState(initialTags);
  const [newGroup, setNewGroup] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newTagGroupId, setNewTagGroupId] = useState("");
  const [draftGroups, setDraftGroups] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialGroups.map((group) => [group.id, group.name])),
  );
  const [draftTags, setDraftTags] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialTags.map((tag) => [tag.id, tag.name])),
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyCatalog(catalog: Catalog) {
    setGroups(catalog.groups);
    setTags(catalog.tags);
    setDraftGroups(
      Object.fromEntries(catalog.groups.map((group) => [group.id, group.name])),
    );
    setDraftTags(
      Object.fromEntries(catalog.tags.map((tag) => [tag.id, tag.name])),
    );
  }

  function syncGroup(item: WorkspaceTagGroup) {
    setGroups((list) => {
      const next = list.map((group) => (group.id === item.id ? item : group));
      if (!next.some((group) => group.id === item.id)) {
        return [...list, item].sort(
          (a, b) =>
            a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
        );
      }
      return next;
    });
    setDraftGroups((prev) => ({ ...prev, [item.id]: item.name }));
  }

  function syncTag(item: WorkspaceTag) {
    setTags((list) => {
      const next = list.map((tag) => (tag.id === item.id ? item : tag));
      if (!next.some((tag) => tag.id === item.id)) return [...list, item];
      return next;
    });
    setDraftTags((prev) => ({ ...prev, [item.id]: item.name }));
  }

  const orderedGroups = useMemo(
    () =>
      [...groups].sort(
        (a, b) =>
          a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
      ),
    [groups],
  );

  function tagsInGroup(groupId: string | null) {
    return tags
      .filter((tag) => tag.group_id === groupId)
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
      );
  }

  async function onCreateGroup(event: FormEvent) {
    event.preventDefault();
    const name = newGroup.trim();
    if (!name || busyKey) return;
    setBusyKey("create-group");
    setError(null);
    try {
      const response = await fetch("/api/admin/workspace/tag-groups/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTagGroup;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "グループの作成に失敗しました");
      }
      syncGroup(data.item);
      setNewGroup("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusyKey(null);
    }
  }

  async function onCreateTag(event: FormEvent) {
    event.preventDefault();
    const name = newTag.trim();
    if (!name || busyKey) return;
    setBusyKey("create-tag");
    setError(null);
    try {
      const response = await fetch("/api/admin/workspace/tags/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          group_id: newTagGroupId || null,
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTag;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "タグの作成に失敗しました");
      }
      syncTag(data.item);
      setNewTag("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveGroupName(group: WorkspaceTagGroup) {
    const name = (draftGroups[group.id] ?? "").trim();
    if (!name) {
      setError("グループ名は必須です");
      setDraftGroups((prev) => ({ ...prev, [group.id]: group.name }));
      return;
    }
    if (name === group.name) return;
    setBusyKey(`group:${group.id}`);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/tag-groups/${group.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const data = (await response.json()) as {
        item?: WorkspaceTagGroup;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      syncGroup(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setDraftGroups((prev) => ({ ...prev, [group.id]: group.name }));
    } finally {
      setBusyKey(null);
    }
  }

  async function saveTagName(tag: WorkspaceTag) {
    const name = (draftTags[tag.id] ?? "").trim();
    if (!name) {
      setError("タグ名は必須です");
      setDraftTags((prev) => ({ ...prev, [tag.id]: tag.name }));
      return;
    }
    if (name === tag.name) return;
    setBusyKey(`tag:${tag.id}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/workspace/tags/${tag.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTag;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      syncTag(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setDraftTags((prev) => ({ ...prev, [tag.id]: tag.name }));
    } finally {
      setBusyKey(null);
    }
  }

  async function moveGroup(group: WorkspaceTagGroup, move: "up" | "down") {
    setBusyKey(`group:${group.id}`);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/tag-groups/${group.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ move }),
        },
      );
      const data = (await response.json()) as Catalog & { error?: string };
      if (!response.ok || !data.groups || !data.tags) {
        throw new Error(data.error || "並び替えに失敗しました");
      }
      applyCatalog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "並び替えに失敗しました");
    } finally {
      setBusyKey(null);
    }
  }

  async function moveTagRow(tag: WorkspaceTag, move: "up" | "down") {
    setBusyKey(`tag:${tag.id}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/workspace/tags/${tag.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move }),
      });
      const data = (await response.json()) as Catalog & { error?: string };
      if (!response.ok || !data.groups || !data.tags) {
        throw new Error(data.error || "並び替えに失敗しました");
      }
      applyCatalog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "並び替えに失敗しました");
    } finally {
      setBusyKey(null);
    }
  }

  async function changeTagGroup(tag: WorkspaceTag, groupId: string) {
    const next = groupId || null;
    if (next === tag.group_id) return;
    setBusyKey(`tag:${tag.id}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/workspace/tags/${tag.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: next }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTag;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "グループの変更に失敗しました");
      }
      syncTag(data.item);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "グループの変更に失敗しました",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function removeGroup(group: WorkspaceTagGroup) {
    if (
      !confirm(
        `グループ「${group.name}」を削除しますか？中のタグは無所属になります。`,
      )
    ) {
      return;
    }
    setBusyKey(`group:${group.id}`);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/tag-groups/${group.id}/`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }
      setGroups((list) => list.filter((item) => item.id !== group.id));
      setTags((list) =>
        list.map((tag) =>
          tag.group_id === group.id ? { ...tag, group_id: null } : tag,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusyKey(null);
    }
  }

  async function removeTag(tag: WorkspaceTag) {
    if (
      !confirm(
        `タグ「${tag.name}」を削除しますか？Docs / Tasks からも外れます。`,
      )
    ) {
      return;
    }
    setBusyKey(`tag:${tag.id}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/workspace/tags/${tag.id}/`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }
      setTags((list) => list.filter((item) => item.id !== tag.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusyKey(null);
    }
  }

  function renderMoveButtons(opts: {
    busy: boolean;
    disableUp: boolean;
    disableDown: boolean;
    onUp: () => void;
    onDown: () => void;
    upLabel: string;
    downLabel: string;
  }) {
    return (
      <div className="flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={opts.busy || opts.disableUp}
          aria-label={opts.upLabel}
          onClick={opts.onUp}
        >
          <ChevronUp className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={opts.busy || opts.disableDown}
          aria-label={opts.downLabel}
          onClick={opts.onDown}
        >
          <ChevronDown className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  function renderTagRow(
    tag: WorkspaceTag,
    index: number,
    siblingCount: number,
  ) {
    const busy = busyKey === `tag:${tag.id}`;
    const draft = draftTags[tag.id] ?? tag.name;
    return (
      <li
        key={tag.id}
        className="flex flex-col gap-2 border-t border-border px-3 py-2.5 sm:flex-row sm:items-center"
      >
        {renderMoveButtons({
          busy,
          disableUp: index === 0,
          disableDown: index >= siblingCount - 1,
          onUp: () => void moveTagRow(tag, "up"),
          onDown: () => void moveTagRow(tag, "down"),
          upLabel: `${tag.name} を上へ`,
          downLabel: `${tag.name} を下へ`,
        })}
        <Input
          value={draft}
          disabled={busy}
          aria-label={`${tag.name} の名前`}
          className="h-9 min-w-0 flex-1"
          onChange={(e) =>
            setDraftTags((prev) => ({ ...prev, [tag.id]: e.target.value }))
          }
          onBlur={() => void saveTagName(tag)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              setDraftTags((prev) => ({ ...prev, [tag.id]: tag.name }));
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <Select
          value={tag.group_id ?? ""}
          disabled={busy}
          aria-label={`${tag.name} のグループ`}
          className="h-9 sm:w-44"
          onChange={(e) => void changeTagGroup(tag, e.target.value)}
        >
          <option value="">無所属</option>
          {orderedGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-red-600 hover:text-red-700"
          disabled={busy}
          aria-label={`${tag.name} を削除`}
          onClick={() => void removeTag(tag)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </li>
    );
  }

  function renderTagList(groupId: string | null) {
    const rows = tagsInGroup(groupId);
    if (rows.length === 0) {
      return (
        <p className="m-0 px-3 py-4 text-sm text-muted-foreground">
          タグはまだありません
        </p>
      );
    }
    return (
      <ul className="m-0 list-none p-0">
        {rows.map((tag, index) => renderTagRow(tag, index, rows.length))}
      </ul>
    );
  }

  const ungrouped = tagsInGroup(null);

  return (
    <div className="space-y-6">
      <AdminSection title="追加">
        <div className="flex flex-col gap-3">
          <form
            onSubmit={onCreateGroup}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="グループ名"
              className="sm:max-w-sm"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={Boolean(busyKey) || !newGroup.trim()}
            >
              <Plus className="size-4" aria-hidden />
              グループを追加
            </Button>
          </form>
          <form
            onSubmit={onCreateTag}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="タグ名"
              className="sm:max-w-sm"
              autoComplete="off"
            />
            <Select
              value={newTagGroupId}
              onChange={(e) => setNewTagGroupId(e.target.value)}
              className="h-10 sm:w-44"
              aria-label="追加するタグのグループ"
            >
              <option value="">無所属</option>
              {orderedGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              disabled={Boolean(busyKey) || !newTag.trim()}
            >
              <Plus className="size-4" aria-hidden />
              タグを追加
            </Button>
          </form>
        </div>
      </AdminSection>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {orderedGroups.map((group, groupIndex) => {
        const busy = busyKey === `group:${group.id}`;
        const draft = draftGroups[group.id] ?? group.name;
        return (
          <section key={group.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {renderMoveButtons({
                busy,
                disableUp: groupIndex === 0,
                disableDown: groupIndex >= orderedGroups.length - 1,
                onUp: () => void moveGroup(group, "up"),
                onDown: () => void moveGroup(group, "down"),
                upLabel: `${group.name} を上へ`,
                downLabel: `${group.name} を下へ`,
              })}
              <Input
                value={draft}
                disabled={busy}
                aria-label={`${group.name} の名前`}
                className="h-9 min-w-0 flex-1"
                onChange={(e) =>
                  setDraftGroups((prev) => ({
                    ...prev,
                    [group.id]: e.target.value,
                  }))
                }
                onBlur={() => void saveGroupName(group)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    setDraftGroups((prev) => ({
                      ...prev,
                      [group.id]: group.name,
                    }));
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-red-600 hover:text-red-700"
                disabled={busy}
                onClick={() => void removeGroup(group)}
              >
                グループを削除
              </Button>
            </div>
            {renderTagList(group.id)}
          </section>
        );
      })}

      <AdminSection
        title="無所属"
        description="グループに入っていないタグ"
      >
        {ungrouped.length === 0 && orderedGroups.length === 0 && tags.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">
            タグはまだありません。Docs / Tasks で使っているタグは自動でここに集まります。
          </p>
        ) : (
          renderTagList(null)
        )}
      </AdminSection>
    </div>
  );
}
