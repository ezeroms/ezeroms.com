import {
  getLibrarySection,
  isLibrarySectionPublic,
  isLibrarySectionStatus,
  type LibrarySectionId,
  type LibrarySectionMeta,
  LIBRARY_SECTIONS,
} from "@/lib/content/library-sections";
import {
  listMappedPublic,
  loadSectionMeta,
  requirePublicOrNotFound,
} from "@/lib/content/queries/section-meta-query";

/**
 * DB の library_section を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadLibrarySection(
  sectionId: LibrarySectionId,
): Promise<LibrarySectionMeta> {
  return loadSectionMeta({
    table: "library_section",
    id: sectionId,
    defaults: getLibrarySection(sectionId),
    isAllowedStatus: isLibrarySectionStatus,
    logLabel: `[loadLibrarySection:${sectionId}]`,
  });
}

/** 公開サイトのサイドナビ等に出す Library 一覧（非公開は除外） */
export async function listPublicLibrarySections(): Promise<LibrarySectionMeta[]> {
  const ids = Object.keys(LIBRARY_SECTIONS) as LibrarySectionId[];
  return listMappedPublic(ids, loadLibrarySection, isLibrarySectionPublic);
}

/** 公開ページ用。非公開なら 404。 */
export async function requirePublicLibrarySection(
  sectionId: LibrarySectionId,
): Promise<LibrarySectionMeta> {
  return requirePublicOrNotFound(
    await loadLibrarySection(sectionId),
    isLibrarySectionPublic,
  );
}
