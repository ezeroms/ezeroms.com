import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { About, MediaCoverage } from "@/types/content";

export async function listAbout(): Promise<About[]> {
  if (!hasSupabaseConfig()) {
    const { listAboutMarkdown } = await import("@/lib/content/about-fs");
    return listAboutMarkdown();
  }
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("about")
      .select("*")
      .eq("status", PUBLISHED)
      .order("slug");
    if (error) throw error;
    const items = (data ?? []) as About[];
    if (items.length) return items;
    const { listAboutMarkdown } = await import("@/lib/content/about-fs");
    return listAboutMarkdown();
  } catch (e) {
    console.error("[listAbout]", e);
    const { listAboutMarkdown } = await import("@/lib/content/about-fs");
    return listAboutMarkdown();
  }
}

export async function getAboutBySlug(slug: string): Promise<About | null> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("about")
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as About;
    } catch (e) {
      console.error("[getAboutBySlug]", e);
    }
  }
  const { readAboutMarkdown } = await import("@/lib/content/about-fs");
  return readAboutMarkdown(slug);
}

export async function listMediaCoverage(): Promise<MediaCoverage[]> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("media_coverage")
        .select("*")
        .eq("status", PUBLISHED)
        .order("date", { ascending: false });
      if (error) throw error;
      const items = (data ?? []) as MediaCoverage[];
      if (items.length) return items;
    } catch (e) {
      console.error("[listMediaCoverage]", e);
    }
  }
  const { listMediaCoverageMarkdown } = await import("@/lib/content/about-fs");
  return listMediaCoverageMarkdown();
}
