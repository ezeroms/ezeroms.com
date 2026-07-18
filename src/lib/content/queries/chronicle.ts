import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import {
  chronicleMatchesAnyInterest,
  chronicleYear,
} from "@/lib/content/chronicle-filter";
import type { Chronicle } from "@/types/content";

export async function listChronicle(opts?: {
  start?: string;
  end?: string;
  tags?: string[];
  category?: string;
  categories?: string[];
  years?: string[];
  /** Interest lenses: society / tech / personal */
  interests?: import("@/lib/content/chronicle-filter").ChronicleInterestId[];
}): Promise<{ items: Chronicle[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("chronicle")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.start) q = q.gte("date", opts.start);
    if (opts?.end) q = q.lte("date", opts.end);
    if (opts?.category) q = q.eq("category", opts.category);
    if (opts?.categories?.length === 1) {
      q = q.eq("category", opts.categories[0]);
    } else if (opts?.categories && opts.categories.length > 1) {
      q = q.in("category", opts.categories);
    }
    if (opts?.tags?.length === 1) {
      q = q.contains("chronicle_tag", opts.tags);
    } else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("chronicle_tag", opts.tags);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    let items = ((data ?? []) as Chronicle[]).map((row) => ({
      ...row,
      chronicle_tag: row.chronicle_tag ?? [],
      category: row.category ?? null,
      subcategory: row.subcategory ?? null,
      description: row.description ?? null,
      body_html: row.body_html ?? "",
      og_image: row.og_image ?? "",
      date_precision: row.date_precision ?? "day",
      end_date: row.end_date ?? null,
    }));

    if (opts?.years?.length) {
      const { chronicleYear } = await import("@/lib/content/chronicle-filter");
      items = items.filter((c) => opts.years!.includes(chronicleYear(c.date)));
    }
    if (opts?.interests?.length) {
      const { chronicleMatchesAnyInterest } = await import(
        "@/lib/content/chronicle-filter"
      );
      items = items.filter((c) =>
        chronicleMatchesAnyInterest(c, opts.interests!),
      );
    }

    const needsPost =
      Boolean(opts?.years?.length) || Boolean(opts?.interests?.length);

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listChronicle]", e);
    return emptyList();
  }
}

export async function listChronicleTaxonomy(): Promise<{
  years: string[];
  tags: string[];
  categories: string[];
}> {
  const { items } = await listChronicle();
  const years = new Set<string>();
  const tags = new Set<string>();
  const categories = new Set<string>();
  const { chronicleYear } = await import("@/lib/content/chronicle-filter");
  for (const c of items) {
    const y = chronicleYear(c.date);
    if (y) years.add(y);
    for (const t of c.chronicle_tag ?? []) tags.add(t);
    if (c.category?.trim()) categories.add(c.category.trim());
  }
  return {
    years: [...years].sort((a, b) => b.localeCompare(a)),
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
    categories: [...categories].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getChronicleBySlug(
  slug: string,
): Promise<Chronicle | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("chronicle")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Chronicle;
  return {
    ...row,
    chronicle_tag: row.chronicle_tag ?? [],
    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
    description: row.description ?? null,
    body_html: row.body_html ?? "",
    og_image: row.og_image ?? "",
    date_precision: row.date_precision ?? "day",
    end_date: row.end_date ?? null,
  };
}
