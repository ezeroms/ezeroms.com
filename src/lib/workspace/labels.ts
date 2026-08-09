/** Local calendar date YYYY-MM-DD in the user's timezone (browser / server local). */
export function todayDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** いまのローカル時刻を datetime-local 用文字列にする（新規作成フォームの初期値向け） */
export function nowDatetimeLocalValue(d = new Date()): string {
  return toDatetimeLocalValue(d.toISOString());
}

/** datetime-local value for end of local today (23:59). */
export function endOfTodayDatetimeLocalValue(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** date / date-only フィールド用。先頭 10 文字（YYYY-MM-DD）だけ残す。 */
export function dateOnlyValue(raw?: string | null): string {
  if (!raw?.trim()) return "";
  return raw.trim().slice(0, 10);
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  inbox: "Inbox",
  active: "Active",
  waiting: "Waiting",
  done: "Done",
  archived: "Archived",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  none: "—",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  inbox: "Inbox",
  active: "Active",
  archived: "Archived",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const TASK_VIEWS = [
  { id: "inbox", label: "Inbox" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "all", label: "All" },
  { id: "completed", label: "Done" },
] as const;

export type TaskViewId = (typeof TASK_VIEWS)[number]["id"];
