import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type {
  About,
  AboutBasedIn,
  AboutFavorite,
  AboutProfile,
  AboutWebLink,
  MediaCoverage,
  MeProfilePayload,
} from "@/types/content";

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

/** Structured Me profile from about_* tables (null until migrated / empty). */
export async function getMeProfile(): Promise<MeProfilePayload | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const sb = getSupabaseAdmin();
    const [profileRes, favRes, basedRes, linkRes] = await Promise.all([
      sb
        .from("about_profile")
        .select("*")
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      sb
        .from("about_favorite")
        .select("*")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
      sb
        .from("about_based_in")
        .select("*")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
      sb
        .from("about_web_link")
        .select("*")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
    ]);

    if (profileRes.error) {
      // Tables not migrated yet
      if (/does not exist|schema cache/i.test(profileRes.error.message)) {
        return null;
      }
      throw profileRes.error;
    }
    if (!profileRes.data) return null;

    return {
      profile: profileRes.data as AboutProfile,
      favorites: (favRes.data ?? []) as AboutFavorite[],
      based_in: (basedRes.data ?? []) as AboutBasedIn[],
      web_links: (linkRes.data ?? []) as AboutWebLink[],
    };
  } catch (e) {
    console.error("[getMeProfile]", e);
    return null;
  }
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
