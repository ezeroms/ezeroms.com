import type { Experience, ExperienceProject } from "@/types/content";

export function formatExperienceDuration(
  startDate: string,
  endDate: string | null,
  now = new Date(),
): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const end = endDate ? new Date(endDate) : now;
  if (Number.isNaN(end.getTime())) return "";

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0 && rem > 0) return `${years}年${rem}ヶ月`;
  if (years > 0) return `${years}年`;
  if (rem > 0) return `${rem}ヶ月`;
  return "1ヶ月未満";
}

export function formatExperiencePeriod(
  startDate: string,
  endDate: string | null,
): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const startLabel = start.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
  });
  if (!endDate) return `${startLabel} – 現在`;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;
  const endLabel = end.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
  });
  return `${startLabel} – ${endLabel}`;
}

export function parseExperienceProjects(raw: unknown): ExperienceProject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const title = String(o.title ?? "").trim();
      if (!title) return null;
      return {
        title,
        description: o.description ? String(o.description) : undefined,
      };
    })
    .filter(Boolean) as ExperienceProject[];
}

export function normalizeExperienceRow(
  row: Record<string, unknown>,
): Experience {
  return {
    id: String(row.id),
    slug: String(row.slug),
    organization: String(row.organization ?? ""),
    employment_type: (row.employment_type as string | null) ?? null,
    title: String(row.title ?? ""),
    role: (row.role as string | null) ?? null,
    start_date: String(row.start_date).slice(0, 10),
    end_date: row.end_date ? String(row.end_date).slice(0, 10) : null,
    summary: String(row.summary ?? ""),
    body_html: String(row.body_html ?? ""),
    projects: parseExperienceProjects(row.projects),
    sort_order: Number(row.sort_order ?? 0) || 0,
    status: (row.status as Experience["status"]) ?? "published",
    published_at: (row.published_at as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/** Assign non-overlapping lanes (greedy). */
export function assignExperienceLanes(
  items: Experience[],
): { item: Experience; lane: number }[] {
  const sorted = [...items].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );
  const laneEnds: string[] = [];
  const result: { item: Experience; lane: number }[] = [];

  for (const item of sorted) {
    const start = item.start_date;
    let lane = laneEnds.findIndex(
      (end) => !end || end < start, // end before start → free
    );
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.end_date ?? "9999-12-31");
    } else {
      laneEnds[lane] = item.end_date ?? "9999-12-31";
    }
    result.push({ item, lane });
  }
  return result;
}

export function experienceTimeBounds(items: Experience[]): {
  startMs: number;
  endMs: number;
} {
  const now = Date.now();
  let min = now;
  let max = now;
  for (const item of items) {
    const s = new Date(item.start_date).getTime();
    const e = item.end_date ? new Date(item.end_date).getTime() : now;
    if (!Number.isNaN(s)) min = Math.min(min, s);
    if (!Number.isNaN(e)) max = Math.max(max, e);
  }
  // pad half year
  const pad = 1000 * 60 * 60 * 24 * 180;
  return { startMs: min - pad, endMs: max + pad };
}

export function yearTicks(startMs: number, endMs: number): number[] {
  const startY = new Date(startMs).getFullYear();
  const endY = new Date(endMs).getFullYear();
  const years: number[] = [];
  for (let y = endY; y >= startY; y--) years.push(y);
  return years;
}
