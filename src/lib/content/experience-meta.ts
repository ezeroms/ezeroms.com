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
  if (years > 0 && rem > 0) {
    return `${years} yr${years === 1 ? "" : "s"} ${rem} mo`;
  }
  if (years > 0) return `${years} yr${years === 1 ? "" : "s"}`;
  if (rem > 0) return `${rem} mo`;
  return "< 1 mo";
}

export function formatExperiencePeriod(
  startDate: string,
  endDate: string | null,
): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const startLabel = start.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  if (!endDate) return `${startLabel} – Present`;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;
  const endLabel = end.toLocaleDateString("en-US", {
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
      const description = o.description
        ? String(o.description).trim()
        : undefined;
      const start_date = o.start_date
        ? String(o.start_date).slice(0, 10)
        : undefined;
      let end_date: string | null | undefined;
      if (o.end_date === null || o.end_date === "") end_date = null;
      else if (o.end_date != null)
        end_date = String(o.end_date).slice(0, 10);
      const role = o.role ? String(o.role).trim() : undefined;
      const team_scale = o.team_scale
        ? String(o.team_scale).trim()
        : undefined;
      const tasks = Array.isArray(o.tasks)
        ? o.tasks.map((t) => String(t).trim()).filter(Boolean)
        : undefined;
      return {
        title,
        description: description || undefined,
        start_date,
        end_date,
        role: role || undefined,
        team_scale: team_scale || undefined,
        tasks: tasks?.length ? tasks : undefined,
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
    business: row.business ? String(row.business) : null,
    employee_count: row.employee_count ? String(row.employee_count) : null,
    capital: row.capital ? String(row.capital) : null,
    note: row.note ? String(row.note) : null,
    summary: String(row.summary ?? ""),
    body_html: String(row.body_html ?? ""),
    projects: parseExperienceProjects(row.projects),
    sort_order: Number(row.sort_order ?? 0) || 0,
    og_image: String(row.og_image ?? ""),
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
