import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  logQueryError,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import {
  diaryMatchesDateRange,
  diaryMatchesWeekdays,
} from "@/lib/content/notes-filter";
import { dateRangeActive, type DateRangeValue } from "@/lib/content/date-range";
import { rankBySharedTags } from "@/lib/content/related";
import type { Diary } from "@/types/content";

export async function listDiary(opts?: {
  month?: string;
  from?: string | null;
  to?: string | null;
  tag?: string;
  tags?: string[];
  place?: string;
  places?: string[];
  weekdays?: number[];
  limit?: number;
}): Promise<{ items: Diary[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  let q = getSupabaseAdmin()
    .from("diary")
    .select("*", { count: "exact" })
    .eq("status", PUBLISHED)
    .eq("is_deleted", false)
    .order("date", { ascending: false });

  if (opts?.month) q = q.contains("diary_month", [opts.month]);
  if (opts?.tag) q = q.contains("diary_tag", [opts.tag]);
  if (opts?.tags?.length === 1) q = q.contains("diary_tag", opts.tags);
  else if (opts?.tags && opts.tags.length > 1) {
    q = q.overlaps("diary_tag", opts.tags);
  }
  if (opts?.place) q = q.eq("diary_place", opts.place);
  if (opts?.places?.length === 1) q = q.eq("diary_place", opts.places[0]);
  else if (opts?.places && opts.places.length > 1) {
    q = q.in("diary_place", opts.places);
  }

  const range: DateRangeValue = {
    from: opts?.from ?? null,
    to: opts?.to ?? null,
  };
  // Date / weekday filters need post-processing; avoid early limit
  const needsPost =
    dateRangeActive(range) ||
    (opts?.weekdays && opts.weekdays.length > 0);
  if (opts?.limit && !needsPost) q = q.limit(opts.limit);

  const { data, error, count } = await q;
  if (error) throw error;

  let items = (data ?? []) as Diary[];

  if (dateRangeActive(range)) {
    items = items.filter((d) => diaryMatchesDateRange(d, range));
  }
  if (opts?.weekdays?.length) {
    items = items.filter((d) => diaryMatchesWeekdays(d, opts.weekdays!));
  }
  if (opts?.limit && needsPost) {
    items = items.slice(0, opts.limit);
  }

  return {
    items,
    total: needsPost ? items.length : (count ?? items.length),
  };
}

export async function getDiaryBySlug(slug: string): Promise<Diary | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  return data as Diary | null;
}

/** Same type (Notes) posts that share ≥1 tag, ranked by overlap then date. */
export async function listRelatedDiary(
  item: Pick<Diary, "slug" | "diary_tag">,
  limit = 6,
): Promise<Diary[]> {
  const tags = item.diary_tag ?? [];
  if (!tags.length) return [];
  const { items } = await listDiary({ tags });
  return rankBySharedTags({
    currentSlug: item.slug,
    currentTags: tags,
    candidates: items,
    getTags: (d) => d.diary_tag,
    limit,
  });
}

export async function listDiaryMonths(): Promise<string[]> {
  const { items } = await listDiary();
  const set = new Set<string>();
  for (const d of items) {
    for (const m of d.diary_month ?? []) {
      const slash = m.match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
      set.add(
        slash
          ? `${slash[1]}-${slash[2].padStart(2, "0")}`
          : m,
      );
    }
  }
  return [...set].sort();
}

/** Tags / places for Notes secondary nav (lightweight select). */
export async function listDiaryTaxonomy(): Promise<{
  tags: string[];
  places: string[];
}> {
  if (!hasSupabaseConfig()) return { tags: [], places: [] };
  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select("diary_tag, diary_place")
    .eq("status", PUBLISHED)
    .eq("is_deleted", false);
  if (error) throw error;
  const tags = new Set<string>();
  const places = new Set<string>();
  for (const row of data ?? []) {
    for (const t of (row.diary_tag as string[] | null) ?? []) {
      if (t) tags.add(t);
    }
    const place = row.diary_place as string | null;
    if (place) places.add(place);
  }
  return {
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
    places: [...places].sort((a, b) => a.localeCompare(b, "ja")),
  };
}
