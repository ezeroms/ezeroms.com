import {
  getWritingSection,
  isWritingSectionPublic,
  isWritingSectionStatus,
  type WritingSectionId,
  type WritingSectionMeta,
  WRITING_SECTIONS,
} from "@/lib/content/writing-sections";
import {
  listMappedPublic,
  loadSectionMeta,
  requirePublicOrNotFound,
} from "@/lib/content/queries/section-meta-query";

/**
 * DB の writing_section を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadWritingSection(
  sectionId: WritingSectionId,
): Promise<WritingSectionMeta> {
  return loadSectionMeta({
    table: "writing_section",
    id: sectionId,
    defaults: getWritingSection(sectionId),
    isAllowedStatus: isWritingSectionStatus,
    logLabel: `[loadWritingSection:${sectionId}]`,
    // 旧 ID `notes` の行が残っている場合は Diary として読む
    fallback:
      sectionId === "diary"
        ? { id: "notes", logLabel: "[loadWritingSection:notes]" }
        : undefined,
  });
}

export async function listPublicWritingSections(): Promise<WritingSectionMeta[]> {
  const ids = Object.keys(WRITING_SECTIONS) as WritingSectionId[];
  return listMappedPublic(ids, loadWritingSection, isWritingSectionPublic);
}

export async function requirePublicWritingSection(
  sectionId: WritingSectionId,
): Promise<WritingSectionMeta> {
  return requirePublicOrNotFound(
    await loadWritingSection(sectionId),
    isWritingSectionPublic,
  );
}
