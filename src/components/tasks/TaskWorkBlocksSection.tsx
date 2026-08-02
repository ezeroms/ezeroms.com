"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import type { TaskWorkBlock } from "@/types/workspace";

type Props = {
  taskId: string;
};

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const date = start.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  const t0 = start.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const t1 = end.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${t0}–${t1}`;
}

/**
 * 1 タスクに紐づく複数の作業枠と、枠ごとの任意の作業日誌。
 * タスク全体のメモ（body_md）とは別。
 */
export function TaskWorkBlocksSection({ taskId }: Props) {
  const [blocks, setBlocks] = useState<TaskWorkBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch(
      `/api/admin/workspace/work-blocks/?task_id=${encodeURIComponent(taskId)}`,
    );
    const data = (await response.json()) as {
      items?: TaskWorkBlock[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || "作業枠の取得に失敗しました");
    }
    setBlocks(data.items ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpandedId(null);
    void (async () => {
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "作業枠の取得に失敗しました",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on task change
  }, [taskId]);

  function openNote(block: TaskWorkBlock) {
    setExpandedId(block.id);
    setNoteDraft(block.note_md ?? "");
  }

  async function saveNote(blockId: string) {
    setSavingNote(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/work-blocks/${blockId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note_md: noteDraft.trim() || null }),
        },
      );
      const data = (await response.json()) as {
        item?: TaskWorkBlock;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "日誌の保存に失敗しました");
      }
      setBlocks((list) =>
        list.map((b) => (b.id === blockId ? data.item! : b)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "日誌の保存に失敗しました");
    } finally {
      setSavingNote(false);
    }
  }

  async function removeBlock(blockId: string) {
    if (!confirm("この作業枠を削除しますか？")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/work-blocks/${blockId}/`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }
      setBlocks((list) => list.filter((b) => b.id !== blockId));
      if (expandedId === blockId) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function addBlock() {
    const startsAt = fromDatetimeLocalValue(newStart);
    const endsAt = fromDatetimeLocalValue(newEnd);
    if (!startsAt || !endsAt) {
      setError("開始・終了を入力してください");
      return;
    }
    if (Date.parse(endsAt) <= Date.parse(startsAt)) {
      setError("終了は開始より後にしてください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/workspace/work-blocks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          starts_at: startsAt,
          ends_at: endsAt,
        }),
      });
      const data = (await response.json()) as {
        item?: TaskWorkBlock;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "作業枠の追加に失敗しました");
      }
      setBlocks((list) =>
        [...list, data.item!].sort((a, b) =>
          a.starts_at.localeCompare(b.starts_at),
        ),
      );
      setAdding(false);
      setNewStart("");
      setNewEnd("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "作業枠の追加に失敗しました",
      );
    } finally {
      setBusy(false);
    }
  }

  function startAdd() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now.getTime() + 30 * 60_000);
    setNewStart(toDatetimeLocalValue(now.toISOString()));
    setNewEnd(toDatetimeLocalValue(end.toISOString()));
    setAdding(true);
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="m-0 text-xs font-medium text-muted-foreground">
          作業枠
        </h3>
        {!adding ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startAdd}
            className="h-7 shrink-0 px-2.5 text-xs"
          >
            追加
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="m-0 text-xs text-muted-foreground">読み込み中…</p>
      ) : null}

      <ul className="m-0 list-none space-y-2 p-0">
        {blocks.map((block) => {
          const open = expandedId === block.id;
          return (
            <li
              key={block.id}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left shadow-none"
                  onClick={() =>
                    open ? setExpandedId(null) : openNote(block)
                  }
                >
                  <span className="block text-sm font-medium text-foreground">
                    {formatRange(block.starts_at, block.ends_at)}
                  </span>
                  {block.note_md ? (
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {block.note_md.split("\n")[0]}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                      作業日誌（任意）
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeBlock(block.id)}
                  className="shrink-0 border-0 bg-transparent px-0 text-[11px] text-muted-foreground transition-colors hover:text-red-600"
                >
                  削除
                </button>
              </div>
              {open ? (
                <div className="mt-2 space-y-2 border-t border-border pt-2">
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    className="admin-input-bare w-full resize-y border-0 bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
                    placeholder="この枠でやったこと・気づき…"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setExpandedId(null)}
                    >
                      閉じる
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      disabled={savingNote}
                      onClick={() => void saveNote(block.id)}
                    >
                      {savingNote ? "保存中…" : "日誌を保存"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border px-3 py-3">
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">
              開始
            </span>
            <Input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="h-8 border-border bg-card text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">
              終了
            </span>
            <Input
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="h-8 border-border bg-card text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setAdding(false)}
              disabled={busy}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={() => void addBlock()}
              disabled={busy}
            >
              追加
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
