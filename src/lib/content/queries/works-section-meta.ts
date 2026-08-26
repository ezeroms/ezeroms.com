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
  isMissingColumnError,
  isSchemaNotReadyError,
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

function parseOgImage(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseDescription(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
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
    const db = getSupabaseAdmin();
    let { data, error } = await db
      .from("works_section")
      .select("id, label, description, status, og_image")
      .eq("id", sectionId)
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await db
        .from("works_section")
        .select("id, label, description, status")
        .eq("id", sectionId)
        .maybeSingle());
    }

    if (error) {
      if (!isSchemaNotReadyError(error)) {
        logQueryError(`[loadWorksSection:${sectionId}]`, error);
      }
      return defaults;
    }

    if (!data) return defaults;

    return {
      ...defaults,
      label: (data.label as string)?.trim() || defaults.label,
      description: parseDescription(
        "description" in data
          ? (data as { description?: unknown }).description
          : "",
        defaults.description,
      ),
      status: parseStatus(data.status, defaults.status),
      og_image:
        parseOgImage(
          "og_image" in data ? (data as { og_image?: unknown }).og_image : "",
        ) || defaults.og_image,
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
