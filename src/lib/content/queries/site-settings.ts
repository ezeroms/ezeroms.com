import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingColumnError,
  isSchemaNotReadyError,
  logQueryError,
} from "@/lib/content/queries/_shared";

export type SiteSettings = {
  og_image: string;
  /** Amazon Associates tracking ID. Empty = no affiliate params. */
  amazon_affiliate_tag: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  og_image: "",
  amazon_affiliate_tag: "",
};

function parseText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * サイト全体設定（シングルトン）。
 * テーブル未作成やカラム未マイグレーション時は既定値にフォールバックする。
 */
export async function loadSiteSettings(): Promise<SiteSettings> {
  if (!hasSupabaseConfig()) return DEFAULT_SITE_SETTINGS;

  try {
    const db = getSupabaseAdmin();
    let { data, error } = await db
      .from("site_settings")
      .select("id, og_image, amazon_affiliate_tag")
      .eq("id", "site")
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await db
        .from("site_settings")
        .select("id, og_image")
        .eq("id", "site")
        .maybeSingle());
    }

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

    const row = data as {
      og_image?: unknown;
      amazon_affiliate_tag?: unknown;
    };

    return {
      og_image:
        parseText(row.og_image) || DEFAULT_SITE_SETTINGS.og_image,
      amazon_affiliate_tag:
        parseText(row.amazon_affiliate_tag) ||
        DEFAULT_SITE_SETTINGS.amazon_affiliate_tag,
    };
  } catch (error) {
    logQueryError("[loadSiteSettings]", error);
    return DEFAULT_SITE_SETTINGS;
  }
}
