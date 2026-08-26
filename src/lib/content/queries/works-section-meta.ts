import {
  getWorksSection,
  isWorksSectionPublic,
  isWorksSectionStatus,
  type WorksSectionId,
  type WorksSectionMeta,
  WORKS_SECTIONS,
} from "@/lib/content/works-sections";
import {
  listMappedPublic,
  loadSectionMeta,
  requirePublicOrNotFound,
} from "@/lib/content/queries/section-meta-query";

/**
 * DB の works_section を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadWorksSection(
  sectionId: WorksSectionId,
): Promise<WorksSectionMeta> {
  return loadSectionMeta({
    table: "works_section",
    id: sectionId,
    defaults: getWorksSection(sectionId),
    isAllowedStatus: isWorksSectionStatus,
    logLabel: `[loadWorksSection:${sectionId}]`,
  });
}

/** 公開サイトのサイドナビ等に出す Works 一覧（非公開は除外） */
export async function listPublicWorksSections(): Promise<WorksSectionMeta[]> {
  const ids = Object.keys(WORKS_SECTIONS) as WorksSectionId[];
  return listMappedPublic(ids, loadWorksSection, isWorksSectionPublic);
}

/** 公開ページ用。非公開なら 404。 */
export async function requirePublicWorksSection(
  sectionId: WorksSectionId,
): Promise<WorksSectionMeta> {
  return requirePublicOrNotFound(
    await loadWorksSection(sectionId),
    isWorksSectionPublic,
  );
}
