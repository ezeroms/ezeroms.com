"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClickToEditField } from "@/components/ui/click-to-edit-field";
import { Input } from "@/components/ui/input";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { sumWorkBlockMinutes } from "@/lib/workspace/task-form";
import type { TaskWorkBlock } from "@/types/workspace";

type Props = {
  taskId: string;
  /** true のとき見出しを出さず、親の ClickToEditRow 内に収める */
  embedded?: boolean;
  /** 作業枠の合計分が変わったとき（親の実績表示用） */
  onActualMinutesChange?: (minutes: number) => void;
};

/** 例: 8/13 (Sat) 16:30–17:00 */
function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const weekday = start.toLocaleDateString("en-US", { weekday: "short" });
  const date = `${start.getMonth() + 1}/${start.getDate()} (${weekday})`;

  const pad = (n: number) => String(n).padStart(2, "0");
  const t0 = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const t1 = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  return `${date} ${t0} – ${t1}`;
}

/**
 * 1 タスクに紐づく複数の作業枠と、枠ごとの任意の作業日誌。
 * タスク全体の詳細（body_md）とは別。
 */
export function TaskWorkBlocksSection({
  taskId,
  embedded = false,
  onActualMinutesChange,
}: Props) {
  const [blocks, setBlocks] = useState<TaskWorkBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // 親の「実績」表示へ、作業枠合計分を伝える
  useEffect(() => {
    onActualMinutesChange?.(sumWorkBlockMinutes(blocks));
  }, [blocks, onActualMinutesChange]);

  async function saveNote(blockId: string, noteMd: string) {
    setError(null);
    const response = await fetch(
      `/api/admin/workspace/work-blocks/${blockId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_md: noteMd.trim() || null }),
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

  const addButton =
    !adding ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startAdd}
        className="h-7 shrink-0 px-2.5 text-xs"
      >
        追加
      </Button>
    ) : null;

  const body = (
    <>
      {loading ? (
        <p className="m-0 text-xs text-muted-foreground">読み込み中…</p>
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {blocks.map((block) => (
          <li
            key={block.id}
            className="relative flex flex-col gap-3 rounded-lg border border-solid border-border p-4"
          >
            <div className="absolute right-3 top-3 z-10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void removeBlock(block.id)}
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
              >
                削除
              </Button>
            </div>
            <p className="m-0 max-w-[calc(100%-3.5rem)] text-sm font-medium text-foreground">
              {formatRange(block.starts_at, block.ends_at)}
            </p>
            <ClickToEditField
              value={block.note_md ?? ""}
              inputType="textarea"
              emptyLabel="作業日誌"
              placeholder="この枠でやったこと・気づき…"
              ariaLabel="作業日誌"
              displayClassName="text-sm leading-relaxed text-foreground"
              onSave={async (next) => {
                await saveNote(block.id, next);
              }}
            />
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-solid border-border p-4">
          <label className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">開始</span>
            <Input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="admin-input-bare h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">終了</span>
            <Input
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="admin-input-bare h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
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
      ) : (
        // カード一覧の右下に追加導線を置く
        <div className="mt-3 flex justify-end">{addButton}</div>
      )}

      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{body}</div>;
  }

  return (
    <section className="mt-8">
      <h3 className="mb-4 m-0 text-xs font-medium text-muted-foreground">
        作業枠
      </h3>
      {body}
    </section>
  );
}
