import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import {
  dateMatchesRange,
  dateMatchesWeekdays,
} from "@/lib/content/notes-filter";
import { dateRangeActive, type DateRangeValue } from "@/lib/content/date-range";
import type { Clip } from "@/types/content";

export async function listClip(opts?: {
  tag?: string;
  tags?: string[];
  from?: string | null;
  to?: string | null;
  weekdays?: number[];
  limit?: number;
}): Promise<{ items: Clip[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("clip")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.tag) q = q.contains("clip_tag", [opts.tag]);
    if (opts?.tags?.length === 1) q = q.contains("clip_tag", opts.tags);
    else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("clip_tag", opts.tags);
    }

    const range: DateRangeValue = {
      from: opts?.from ?? null,
      to: opts?.to ?? null,
    };
    const needsPost =
      dateRangeActive(range) ||
      (opts?.weekdays && opts.weekdays.length > 0);
    if (opts?.limit && !needsPost) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    let items = ((data ?? []) as Clip[]).map((row) => ({
      ...row,
      source_name: row.source_name ?? "",
      og_image: row.og_image ?? "",
      og_description: row.og_description ?? "",
      memo: row.memo ?? "",
      clip_tag: row.clip_tag ?? [],
    }));

    if (dateRangeActive(range)) {
      items = items.filter((c) => dateMatchesRange(c.date, range));
    }
    if (opts?.weekdays?.length) {
      items = items.filter((c) => dateMatchesWeekdays(c.date, opts.weekdays!));
    }
    if (opts?.limit && needsPost) {
      items = items.slice(0, opts.limit);
    }

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listClip]", e);
    return emptyList();
  }
}

export async function listClipMonths(): Promise<string[]> {
  const { items } = await listClip();
  const set = new Set<string>();
  for (const c of items) {
    const key = c.date.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key)) set.add(key);
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

export async function listClipTags(): Promise<string[]> {
  const { items } = await listClip();
  const set = new Set<string>();
  for (const c of items) {
    for (const t of c.clip_tag ?? []) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ja"));
}

export async function getClipBySlug(slug: string): Promise<Clip | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("clip")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();
    if (error) throw error;
    return data as Clip | null;
  } catch {
    return null;
  }
}
