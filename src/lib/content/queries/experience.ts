import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingRelationError,
  logQueryError,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { Experience } from "@/types/content";

export async function listExperience(): Promise<Experience[]> {
  const { listExperienceMarkdown } = await import(
    "@/lib/content/experience-fs"
  );
  const { normalizeExperienceRow } = await import(
    "@/lib/content/experience-meta"
  );

  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("experience")
        .select("*")
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .order("start_date", { ascending: false });
      if (error) {
        if (isMissingRelationError(error)) return listExperienceMarkdown();
        throw error;
      }
      const items = (data ?? []).map((row) =>
        normalizeExperienceRow(row as Record<string, unknown>),
      );
      if (items.length) return items;
    } catch (e) {
      logQueryError("[listExperience]", e);
    }
  }
  return listExperienceMarkdown();
}

export async function getExperienceBySlug(
  slug: string,
): Promise<Experience | null> {
  const { readExperienceMarkdown } = await import(
    "@/lib/content/experience-fs"
  );
  const { normalizeExperienceRow } = await import(
    "@/lib/content/experience-meta"
  );

  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("experience")
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .maybeSingle();
      if (error) {
        if (!isMissingRelationError(error)) {
          logQueryError("[getExperienceBySlug]", error);
        }
      } else if (data) {
        return normalizeExperienceRow(data as Record<string, unknown>);
      }
    } catch (e) {
      logQueryError("[getExperienceBySlug]", e);
    }
  }
  return readExperienceMarkdown(slug);
}
