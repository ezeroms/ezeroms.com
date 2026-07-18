import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import {
  dateMatchesMonths,
  dateMatchesWeekdays,
} from "@/lib/content/notes-filter";
import { rankBySharedTags } from "@/lib/content/related";
import type { Column } from "@/types/content";

export async function listColumn(opts?: {
  category?: string;
  categories?: string[];
  tag?: string;
  tags?: string[];
  months?: string[];
  weekdays?: number[];
  limit?: number;
}): Promise<{ items: Column[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("column")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.category) q = q.contains("column_category", [opts.category]);
    if (opts?.categories?.length === 1) {
      q = q.contains("column_category", opts.categories);
    } else if (opts?.categories && opts.categories.length > 1) {
      q = q.overlaps("column_category", opts.categories);
    }
    if (opts?.tag) q = q.contains("column_tag", [opts.tag]);
    if (opts?.tags?.length === 1) q = q.contains("column_tag", opts.tags);
    else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("column_tag", opts.tags);
    }

    const needsPost =
      (opts?.months && opts.months.length > 0) ||
      (opts?.weekdays && opts.weekdays.length > 0);
    if (opts?.limit && !needsPost) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    let items = (data ?? []) as Column[];

    if (opts?.months?.length) {
      items = items.filter((c) => dateMatchesMonths(c.date, opts.months!));
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
    console.error("[listColumn]", e);
    return emptyList();
  }
}

export async function listColumnMonths(): Promise<string[]> {
  const { items } = await listColumn();
  const set = new Set<string>();
  for (const c of items) {
    const key = c.date.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key)) set.add(key);
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

export async function listColumnTaxonomy(): Promise<{
  categories: string[];
  tags: string[];
}> {
  const { items } = await listColumn();
  const categories = new Set<string>();
  const tags = new Set<string>();
  for (const c of items) {
    for (const cat of c.column_category ?? []) categories.add(cat);
    for (const tag of c.column_tag ?? []) tags.add(tag);
  }
  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b, "ja")),
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getColumnBySlug(slug: string): Promise<Column | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("column")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  return data as Column | null;
}

/** Same type (Column) posts that share ≥1 tag, ranked by overlap then date. */
export async function listRelatedColumn(
  item: Pick<Column, "slug" | "column_tag">,
  limit = 6,
): Promise<Column[]> {
  const tags = item.column_tag ?? [];
  if (!tags.length) return [];
  const { items } = await listColumn({ tags });
  return rankBySharedTags({
    currentSlug: item.slug,
    currentTags: tags,
    candidates: items,
    getTags: (c) => c.column_tag,
    limit,
  });
}
