import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import { rankBySharedTags } from "@/lib/content/related";
import type { ShouldersOfGiants } from "@/types/content";

function normalizeGiantsRow(row: ShouldersOfGiants): ShouldersOfGiants {
  return {
    ...row,
    giants_tag: row.giants_tag ?? [],
    book_title: row.book_title ?? null,
    author: row.author ?? null,
    publisher: row.publisher ?? null,
    published_year: row.published_year ?? null,
    citation_override: row.citation_override ?? null,
    source_url: row.source_url ?? null,
    body_html: row.body_html ?? "",
    og_image: row.og_image ?? "",
  };
}

export async function listGiants(opts?: {
  tag?: string;
  tags?: string[];
  limit?: number;
}): Promise<{ items: ShouldersOfGiants[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    const tags =
      opts?.tags ?? (opts?.tag ? [opts.tag] : undefined);

    let q = getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("created_at", { ascending: false });
    if (tags?.length === 1) {
      q = q.contains("giants_tag", tags);
    } else if (tags && tags.length > 1) {
      q = q.overlaps("giants_tag", tags);
    }
    if (opts?.limit) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    const items = ((data ?? []) as ShouldersOfGiants[]).map(normalizeGiantsRow);
    return { items, total: count ?? items.length };
  } catch (e) {
    console.error("[listGiants]", e);
    return emptyList();
  }
}

export async function listGiantsTags(): Promise<string[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("giants_tag")
      .eq("status", PUBLISHED);
    if (error) throw error;
    const set = new Set<string>();
    for (const row of data ?? []) {
      for (const t of (row.giants_tag as string[] | null) ?? []) {
        if (t?.trim()) set.add(t.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "ja"));
  } catch (e) {
    console.error("[listGiantsTags]", e);
    return [];
  }
}

export async function getGiantsBySlug(
  slug: string,
): Promise<ShouldersOfGiants | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return normalizeGiantsRow(data as ShouldersOfGiants);
  } catch (e) {
    console.error("[getGiantsBySlug]", e);
    return null;
  }
}

/** Same type (Giants) posts that share ≥1 tag, ranked by overlap then date. */
export async function listRelatedGiants(
  item: Pick<ShouldersOfGiants, "slug" | "giants_tag">,
  limit = 6,
): Promise<ShouldersOfGiants[]> {
  const tags = item.giants_tag ?? [];
  if (!tags.length) return [];
  const { items } = await listGiants({ tags });
  const ranked = rankBySharedTags({
    currentSlug: item.slug,
    currentTags: tags,
    candidates: items.map((entry) => ({
      ...entry,
      date: entry.published_at ?? entry.created_at,
    })),
    getTags: (entry) => entry.giants_tag,
    limit,
  });
  return ranked.map(({ date: _date, ...rest }) => rest as ShouldersOfGiants);
}
