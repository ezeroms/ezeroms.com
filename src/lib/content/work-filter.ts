import { WORK_CATEGORY_NAMES } from "@/components/WorkHeaderNav";
import type { WorkKind } from "@/types/content";

export type WorkFilterState = {
  years: string[];
  categories: string[];
  tags: string[];
  clients: string[];
  kinds: WorkKind[];
};

export const WORK_KIND_LABELS: Record<WorkKind, string> = {
  product: "プロダクト",
  commission: "受託制作",
  involvement: "関与・コラボ",
};

export function emptyWorkFilter(): WorkFilterState {
  return { years: [], categories: [], tags: [], clients: [], kinds: [] };
}

export function workFilterActive(f: WorkFilterState): boolean {
  return (
    f.years.length > 0 ||
    f.categories.length > 0 ||
    f.tags.length > 0 ||
    f.clients.length > 0 ||
    f.kinds.length > 0
  );
}

function one(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function decodeList(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => {
      try {
        return decodeURIComponent(s.trim());
      } catch {
        return s.trim();
      }
    })
    .filter(Boolean);
}

function isWorkKind(v: string): v is WorkKind {
  return v === "product" || v === "commission" || v === "involvement";
}

/** Parse `?y=&c=&t=&cl=&k=` */
export function parseWorkFilter(
  sp: Record<string, string | string[] | undefined>,
): WorkFilterState {
  const years = one(sp, "y")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}$/.test(s));
  const kinds = one(sp, "k")
    .split(",")
    .map((s) => s.trim())
    .filter(isWorkKind);
  return {
    years,
    categories: decodeList(one(sp, "c")),
    tags: decodeList(one(sp, "t")),
    clients: decodeList(one(sp, "cl")),
    kinds,
  };
}

export function serializeWorkFilter(f: WorkFilterState): string {
  const q = new URLSearchParams();
  if (f.years.length) q.set("y", f.years.join(","));
  if (f.categories.length) {
    q.set("c", f.categories.map((c) => encodeURIComponent(c)).join("|"));
  }
  if (f.tags.length) {
    q.set("t", f.tags.map((t) => encodeURIComponent(t)).join("|"));
  }
  if (f.clients.length) {
    q.set("cl", f.clients.map((c) => encodeURIComponent(c)).join("|"));
  }
  if (f.kinds.length) q.set("k", f.kinds.join(","));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function workCategoryLabel(cat: string): string {
  return WORK_CATEGORY_NAMES[cat] ?? cat;
}

/** Prefer start_date, fall back to date */
export function workPrimaryDate(item: {
  start_date: string | null;
  date: string;
}): Date {
  if (item.start_date) {
    const d = new Date(item.start_date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(item.date);
}

export function workYear(item: {
  start_date: string | null;
  date: string;
}): string {
  const d = workPrimaryDate(item);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear());
}

export function formatWorkPeriod(
  startDate: string | null,
  endDate: string | null,
): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const startLabel = start.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
  });
  if (!endDate) return `${startLabel} –`;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;
  const endLabel = end.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
  });
  return `${startLabel} – ${endLabel}`;
}

export function normalizeWorkRow<T extends Record<string, unknown>>(
  row: T,
): T & {
  work_kind: WorkKind;
  product_key: string | null;
  work_category: string[];
  work_tag: string[];
} {
  const kind = row.work_kind;
  const work_kind: WorkKind =
    kind === "product" || kind === "involvement" || kind === "commission"
      ? kind
      : "commission";
  return {
    ...row,
    work_kind,
    product_key: (row.product_key as string | null | undefined) ?? null,
    work_category: (row.work_category as string[] | null | undefined) ?? [],
    work_tag: (row.work_tag as string[] | null | undefined) ?? [],
  };
}
