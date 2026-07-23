import { notFound } from "next/navigation";
import {
  getLibrarySection,
  isLibrarySectionPublic,
  isLibrarySectionStatus,
  type LibrarySectionId,
  type LibrarySectionMeta,
  type LibrarySectionStatus,
  LIBRARY_SECTIONS,
} from "@/lib/content/library-sections";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingRelationError,
  logQueryError,
} from "@/lib/content/queries/_shared";

function parseStatus(
  value: unknown,
  fallback: LibrarySectionStatus,
): LibrarySectionStatus {
  return typeof value === "string" && isLibrarySectionStatus(value)
    ? value
    : fallback;
}

/**
 * DB の library_section を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadLibrarySection(
  sectionId: LibrarySectionId,
): Promise<LibrarySectionMeta> {
  const defaults = getLibrarySection(sectionId);

  if (!hasSupabaseConfig()) return defaults;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("library_section")
      .select("id, label, status")
      .eq("id", sectionId)
      .maybeSingle();

    if (error) {
      if (!isMissingRelationError(error)) {
        logQueryError(`[loadLibrarySection:${sectionId}]`, error);
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
    logQueryError(`[loadLibrarySection:${sectionId}]`, error);
    return defaults;
  }
}

/** 公開サイトのサイドナビ等に出す Library 一覧（非公開は除外） */
export async function listPublicLibrarySections(): Promise<LibrarySectionMeta[]> {
  const ids = Object.keys(LIBRARY_SECTIONS) as LibrarySectionId[];
  const sections = await Promise.all(ids.map((id) => loadLibrarySection(id)));
  return sections.filter(isLibrarySectionPublic);
}

/** 公開ページ用。非公開なら 404。 */
export async function requirePublicLibrarySection(
  sectionId: LibrarySectionId,
): Promise<LibrarySectionMeta> {
  const section = await loadLibrarySection(sectionId);
  if (!isLibrarySectionPublic(section)) notFound();
  return section;
}
