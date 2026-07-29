import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingColumnError,
  isSchemaNotReadyError,
  logQueryError,
} from "@/lib/content/queries/_shared";

export type SiteSettings = {
  og_image: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  og_image: "",
};

function parseOgImage(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * サイト全体設定（シングルトン）。
 * テーブル未作成や og_image 未マイグレーション時は既定値にフォールバックする。
 */
export async function loadSiteSettings(): Promise<SiteSettings> {
  if (!hasSupabaseConfig()) return DEFAULT_SITE_SETTINGS;

  try {
    const db = getSupabaseAdmin();
    let { data, error } = await db
      .from("site_settings")
      .select("id, og_image")
      .eq("id", "site")
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await db
        .from("site_settings")
        .select("id")
        .eq("id", "site")
        .maybeSingle());
    }

    if (error) {
      if (!isSchemaNotReadyError(error)) {
        logQueryError("[loadSiteSettings]", error);
      }
      return DEFAULT_SITE_SETTINGS;
    }

    if (!data) return DEFAULT_SITE_SETTINGS;

    return {
      og_image:
        parseOgImage(
          "og_image" in data ? (data as { og_image?: unknown }).og_image : "",
        ) || DEFAULT_SITE_SETTINGS.og_image,
    };
  } catch (error) {
    logQueryError("[loadSiteSettings]", error);
    return DEFAULT_SITE_SETTINGS;
  }
}
