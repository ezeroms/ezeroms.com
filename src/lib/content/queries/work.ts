import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import { workYear } from "@/lib/content/work-filter";
import type { Work } from "@/types/content";

export async function listWork(opts?: {
  category?: string;
  categories?: string[];
  tag?: string;
  tags?: string[];
  clients?: string[];
  years?: string[];
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
    const { normalizeWorkRow, workYear } = await import(
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
    if (opts?.years?.length) {
      items = items.filter((w) => opts.years!.includes(workYear(w)));
    }

    const needsPost =
      Boolean(opts?.years?.length) ||
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
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { normalizeWorkRow } = await import("@/lib/content/work-filter");
  return normalizeWorkRow(data as unknown as Record<string, unknown>) as Work;
}
