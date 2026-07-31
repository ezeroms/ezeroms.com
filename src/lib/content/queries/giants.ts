import { withAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import { loadSiteSettings } from "@/lib/content/queries/site-settings";
import { rankBySharedTags } from "@/lib/content/related";
import type { ShouldersOfGiants } from "@/types/content";

function normalizeGiantsRow(
  row: ShouldersOfGiants,
  amazonAffiliateTag = "",
): ShouldersOfGiants {
  return {
    ...row,
    topic: row.topic ?? [],
    book_title: row.book_title ?? null,
    author: row.author ?? null,
    publisher: row.publisher ?? null,
    published_year: row.published_year ?? null,
    citation_override: row.citation_override ?? null,
    source_url: withAmazonAffiliateTag(row.source_url, amazonAffiliateTag),
    body_html: row.body_html ?? "",
    og_image: row.og_image ?? "",
  };
}

async function amazonAffiliateTag(): Promise<string> {
  const settings = await loadSiteSettings();
  return settings.amazon_affiliate_tag;
}

export async function listGiants(opts?: {
  topic?: string;
  topics?: string[];
  limit?: number;
}): Promise<{ items: ShouldersOfGiants[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("created_at", { ascending: false });
    if (opts?.topic) q = q.contains("topic", [opts.topic]);
    if (opts?.topics?.length === 1) {
      q = q.contains("topic", opts.topics);
    } else if (opts?.topics && opts.topics.length > 1) {
      q = q.overlaps("topic", opts.topics);
    }
    if (opts?.limit) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    const tag = await amazonAffiliateTag();
    const items = ((data ?? []) as ShouldersOfGiants[]).map((row) =>
      normalizeGiantsRow(row, tag),
    );
    return { items, total: count ?? items.length };
  } catch (e) {
    console.error("[listGiants]", e);
    return emptyList();
  }
}

export async function listGiantsTopics(): Promise<string[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("topic")
      .eq("status", PUBLISHED);
    if (error) throw error;
    const set = new Set<string>();
    for (const row of data ?? []) {
      for (const t of (row.topic as string[] | null) ?? []) {
        if (t?.trim()) set.add(t.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "ja"));
  } catch (e) {
    console.error("[listGiantsTopics]", e);
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
    const tag = await amazonAffiliateTag();
    return normalizeGiantsRow(data as ShouldersOfGiants, tag);
  } catch (e) {
    console.error("[getGiantsBySlug]", e);
    return null;
  }
}

/** Same type (Giants) posts that share ≥1 topic, ranked by overlap then date. */
export async function listRelatedGiants(
  item: Pick<ShouldersOfGiants, "slug" | "topic">,
  limit = 6,
): Promise<ShouldersOfGiants[]> {
  const topics = item.topic ?? [];
  if (!topics.length) return [];
  const { items } = await listGiants({ topics });
  const ranked = rankBySharedTags({
    currentSlug: item.slug,
    currentTags: topics,
    candidates: items.map((entry) => ({
      ...entry,
      date: entry.published_at ?? entry.created_at,
    })),
    getTags: (entry) => entry.topic,
    limit,
  });
  return ranked.map(({ date: _date, ...rest }) => rest as ShouldersOfGiants);
}
