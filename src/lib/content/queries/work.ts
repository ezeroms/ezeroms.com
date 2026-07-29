import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { Work } from "@/types/content";

export async function listWork(opts?: {
  category?: string;
  categories?: string[];
  tag?: string;
  tags?: string[];
  clients?: string[];
  from?: string | null;
  to?: string | null;
  kinds?: import("@/types/content").WorkKind[];
  /** Exclude these kinds (e.g. Creative excludes involvement) */
  excludeKinds?: import("@/types/content").WorkKind[];
  productKey?: string;
  limit?: number;
}): Promise<{ items: Work[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("work")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .eq("is_deleted", false)
      .order("date", { ascending: false });
    if (opts?.category) q = q.contains("work_category", [opts.category]);
    if (opts?.categories?.length === 1) {
      q = q.contains("work_category", opts.categories);
    } else if (opts?.categories && opts.categories.length > 1) {
      q = q.overlaps("work_category", opts.categories);
    }
    if (opts?.tag) q = q.contains("work_tag", [opts.tag]);
    if (opts?.tags?.length === 1) q = q.contains("work_tag", opts.tags);
    else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("work_tag", opts.tags);
    }
    if (opts?.clients?.length === 1) q = q.eq("client", opts.clients[0]);
    else if (opts?.clients && opts.clients.length > 1) {
      q = q.in("client", opts.clients);
    }
    // Prefer client-side kind/product filters until columns are guaranteed
    if (opts?.limit) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    const { normalizeWorkRow, workMatchesDateRange } = await import(
      "@/lib/content/work-filter"
    );
    let items = ((data ?? []) as Work[]).map((row) =>
      normalizeWorkRow(row as unknown as Record<string, unknown>),
    ) as Work[];

    if (opts?.kinds?.length) {
      items = items.filter((w) => opts.kinds!.includes(w.work_kind));
    }
    if (opts?.excludeKinds?.length) {
      items = items.filter((w) => !opts.excludeKinds!.includes(w.work_kind));
    }
    if (opts?.productKey) {
      items = items.filter((w) => w.product_key === opts.productKey);
    }
    const range = { from: opts?.from ?? null, to: opts?.to ?? null };
    if (range.from || range.to) {
      items = items.filter((w) => workMatchesDateRange(w, range));
    }

    const needsPost =
      Boolean(range.from || range.to) ||
      Boolean(opts?.excludeKinds?.length) ||
      Boolean(opts?.kinds?.length) ||
      Boolean(opts?.productKey);

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listWork]", e);
    return emptyList();
  }
}

export async function listWorkTaxonomy(): Promise<{
  years: string[];
  categories: string[];
  tags: string[];
  clients: string[];
}> {
  const { items } = await listWork();
  const years = new Set<string>();
  const categories = new Set<string>();
  const tags = new Set<string>();
  const clients = new Set<string>();
  const { workYear } = await import("@/lib/content/work-filter");
  for (const w of items) {
    const y = workYear(w);
    if (y) years.add(y);
    for (const c of w.work_category ?? []) categories.add(c);
    for (const t of w.work_tag ?? []) tags.add(t);
    if (w.client?.trim()) clients.add(w.client.trim());
  }
  return {
    years: [...years].sort((a, b) => b.localeCompare(a)),
    categories: [...categories],
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
    clients: [...clients].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getWorkBySlug(slug: string): Promise<Work | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("work")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { normalizeWorkRow } = await import("@/lib/content/work-filter");
  return normalizeWorkRow(data as unknown as Record<string, unknown>) as Work;
}

/** Same type (Work) posts that share ≥1 tag, ranked by overlap then date. */
export async function listRelatedWork(
  item: Pick<Work, "slug" | "work_tag">,
  limit = 6,
): Promise<Work[]> {
  const tags = item.work_tag ?? [];
  if (!tags.length) return [];
  const { items } = await listWork({
    tags,
    excludeKinds: ["involvement"],
  });
  const { rankBySharedTags } = await import("@/lib/content/related");
  return rankBySharedTags({
    currentSlug: item.slug,
    currentTags: tags,
    candidates: items,
    getTags: (w) => w.work_tag,
    limit,
  });
}

/**
 * 公開 Creative を日付新しい順で見たときの隣接作品。
 * - previous: より古い（一覧では後ろ）
 * - next: より新しい（一覧では前）
 */
export async function getAdjacentWork(slug: string): Promise<{
  previous: Work | null;
  next: Work | null;
}> {
  const { items } = await listWork({ excludeKinds: ["involvement"] });
  const index = items.findIndex((w) => w.slug === slug);
  if (index < 0) return { previous: null, next: null };

  return {
    previous: index < items.length - 1 ? items[index + 1]! : null,
    next: index > 0 ? items[index - 1]! : null,
  };
}
