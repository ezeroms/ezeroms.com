import { notFound } from "next/navigation";
import {
  getWritingSection,
  isWritingSectionPublic,
  isWritingSectionStatus,
  type WritingSectionId,
  type WritingSectionMeta,
  type WritingSectionStatus,
  WRITING_SECTIONS,
} from "@/lib/content/writing-sections";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingColumnError,
  isSchemaNotReadyError,
  logQueryError,
} from "@/lib/content/queries/_shared";

function parseStatus(
  value: unknown,
  fallback: WritingSectionStatus,
): WritingSectionStatus {
  return typeof value === "string" && isWritingSectionStatus(value)
    ? value
    : fallback;
}

function parseOgImage(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * DB の writing_section を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadWritingSection(
  sectionId: WritingSectionId,
): Promise<WritingSectionMeta> {
  const defaults = getWritingSection(sectionId);

  if (!hasSupabaseConfig()) return defaults;

  try {
    const db = getSupabaseAdmin();
    let { data, error } = await db
      .from("writing_section")
      .select("id, label, description, status, og_image")
      .eq("id", sectionId)
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await db
        .from("writing_section")
        .select("id, label, description, status")
        .eq("id", sectionId)
        .maybeSingle());
    }

    if (error) {
      if (!isSchemaNotReadyError(error)) {
        logQueryError(`[loadWritingSection:${sectionId}]`, error);
      }
      return defaults;
    }

    if (!data) return defaults;

    return {
      ...defaults,
      label: (data.label as string)?.trim() || defaults.label,
      description:
        typeof data.description === "string"
          ? data.description
          : defaults.description,
      status: parseStatus(data.status, defaults.status),
      og_image:
        parseOgImage(
          "og_image" in data ? (data as { og_image?: unknown }).og_image : "",
        ) || defaults.og_image,
    };
  } catch (error) {
    logQueryError(`[loadWritingSection:${sectionId}]`, error);
    return defaults;
  }
}

export async function listPublicWritingSections(): Promise<WritingSectionMeta[]> {
  const ids = Object.keys(WRITING_SECTIONS) as WritingSectionId[];
  const sections = await Promise.all(ids.map((id) => loadWritingSection(id)));
  return sections.filter(isWritingSectionPublic);
}

export async function requirePublicWritingSection(
  sectionId: WritingSectionId,
): Promise<WritingSectionMeta> {
  const section = await loadWritingSection(sectionId);
  if (!isWritingSectionPublic(section)) notFound();
  return section;
}
