import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { UiDesignGuidebook } from "@/types/content";

export async function listUidg(opts?: {
  section?: string;
}): Promise<UiDesignGuidebook[]> {
  if (!hasSupabaseConfig()) return [];
  let q = getSupabaseAdmin()
    .from("ui_design_guidebook")
    .select("*")
    .eq("status", PUBLISHED)
    .order("sort_order", { ascending: true });
  if (opts?.section) q = q.eq("section", opts.section);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as UiDesignGuidebook[];
}

export async function getUidgBySlug(
  slug: string,
): Promise<UiDesignGuidebook | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("ui_design_guidebook")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  return data as UiDesignGuidebook | null;
}
