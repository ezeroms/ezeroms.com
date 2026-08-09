/**
 * タスク編集フォーム共通の入力パース。
 * UI（モーダル / パネル / 詳細ページ）で同じルールを共有する。
 */

import type { TaskWorkBlock } from "@/types/workspace";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** 空欄 → null。数値あり → 正の整数のみ可（見積分）。 */
export function parseEstimatedMinutesInput(
  raw: string,
): ParseResult<number | null> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const minutes = Number(trimmed);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return { ok: false, error: "見積は正の整数で入力してください" };
  }
  return { ok: true, value: minutes };
}

/** 空欄 → 0。0〜100 の数値のみ可（保存時は丸める）。 */
export function parseProgressPercentInput(raw: string): ParseResult<number> {
  const trimmed = raw.trim();
  const progress = trimmed ? Number(trimmed) : 0;
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    return { ok: false, error: "進捗は 0〜100 で入力してください" };
  }
  return { ok: true, value: Math.round(progress) };
}

/** フォーム表示用。未設定・不正値は空文字。 */
export function formatEstimatedMinutesInput(
  value: number | null | undefined,
): string {
  if (value == null) return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n));
}

/**
 * 作業枠の合計分（実績）。
 * 終了≦開始や不正な日時は 0 分として足さない。
 */
export function sumWorkBlockMinutes(
  blocks: Pick<TaskWorkBlock, "starts_at" | "ends_at">[],
): number {
  let total = 0;
  for (const block of blocks) {
    const startMs = Date.parse(block.starts_at);
    const endMs = Date.parse(block.ends_at);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      continue;
    }
    total += Math.round((endMs - startMs) / 60_000);
  }
  return total;
}
