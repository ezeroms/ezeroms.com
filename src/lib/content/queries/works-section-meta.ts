import { notFound } from "next/navigation";
import {
  getWorksSection,
  isWorksSectionPublic,
  isWorksSectionStatus,
  type WorksSectionId,
  type WorksSectionMeta,
  type WorksSectionStatus,
  WORKS_SECTIONS,
} from "@/lib/content/works-sections";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingRelationError,
  logQueryError,
} from "@/lib/content/queries/_shared";

function parseStatus(
  value: unknown,
  fallback: WorksSectionStatus,
): WorksSectionStatus {
  return typeof value === "string" && isWorksSectionStatus(value)
    ? value
    : fallback;
}

/**
 * DB の works_section を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadWorksSection(
  sectionId: WorksSectionId,
): Promise<WorksSectionMeta> {
  const defaults = getWorksSection(sectionId);

  if (!hasSupabaseConfig()) return defaults;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("works_section")
      .select("id, label, status")
      .eq("id", sectionId)
      .maybeSingle();

    if (error) {
      if (!isMissingRelationError(error)) {
        logQueryError(`[loadWorksSection:${sectionId}]`, error);
      }
      return defaults;
    }

    if (!data) return defaults;

    return {
      ...defaults,
      label: (data.label as string)?.trim() || defaults.label,
      status: parseStatus(data.status, defaults.status),
    };
  } catch (error) {
    logQueryError(`[loadWorksSection:${sectionId}]`, error);
    return defaults;
  }
}

/** 公開サイトのサイドナビ等に出す Works 一覧（非公開は除外） */
export async function listPublicWorksSections(): Promise<WorksSectionMeta[]> {
  const ids = Object.keys(WORKS_SECTIONS) as WorksSectionId[];
  const sections = await Promise.all(ids.map((id) => loadWorksSection(id)));
  return sections.filter(isWorksSectionPublic);
}

/** 公開ページ用。非公開なら 404。 */
export async function requirePublicWorksSection(
  sectionId: WorksSectionId,
): Promise<WorksSectionMeta> {
  const section = await loadWorksSection(sectionId);
  if (!isWorksSectionPublic(section)) notFound();
  return section;
}
