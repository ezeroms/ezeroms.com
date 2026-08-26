/**
 * セクション／ギャラリーのページ設定行を DB から読む。
 * og_image 列がまだ無い環境では、列なしで再取得する。
 */

import { notFound } from "next/navigation";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingColumnError,
  isSchemaNotReadyError,
  logQueryError,
} from "@/lib/content/queries/_shared";
import {
  fieldFromRow,
  statusFromRow,
  textFromRow,
} from "@/lib/content/queries/section-meta-fields";

const SELECT_WITH_OG = "id, label, description, status, og_image";
const SELECT_WITHOUT_OG = "id, label, description, status";

export type SectionMetaRow = {
  label?: unknown;
  description?: unknown;
  status?: unknown;
  og_image?: unknown;
};

export type SectionMetaFields<TStatus extends string> = {
  label: string;
  description: string;
  status: TStatus;
  og_image: string;
};

/** 1 行取る。設定なし・未接続・スキーマ未適用なら null（呼び出し側がコード既定に落とす）。 */
export async function fetchSectionMetaRow(
  table: string,
  id: string,
  logLabel: string,
): Promise<SectionMetaRow | null> {
  if (!hasSupabaseConfig()) return null;

  try {
    const db = getSupabaseAdmin();
    let { data, error } = await db
      .from(table)
      .select(SELECT_WITH_OG)
      .eq("id", id)
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await db
        .from(table)
        .select(SELECT_WITHOUT_OG)
        .eq("id", id)
        .maybeSingle());
    }

    if (error) {
      if (!isSchemaNotReadyError(error)) {
        logQueryError(logLabel, error);
      }
      return null;
    }

    return (data as SectionMetaRow | null) ?? null;
  } catch (error) {
    logQueryError(logLabel, error);
    return null;
  }
}

/**
 * DB 行をコード上の既定に重ねる。
 * `keepEmptyDescription`: Photo 用。空文字は「説明なし」として残し、コード既定に戻さない。
 */
export function overlaySectionMetaFields<T extends SectionMetaFields<string>>(
  defaults: T,
  row: SectionMetaRow | null,
  isAllowedStatus: (value: string) => value is T["status"],
  options?: { keepEmptyDescription?: boolean },
): T {
  if (!row) return defaults;

  const description = options?.keepEmptyDescription
    ? typeof row.description === "string"
      ? row.description
      : defaults.description
    : textFromRow(fieldFromRow(row, "description"), defaults.description);

  return {
    ...defaults,
    label: textFromRow(row.label, defaults.label),
    description,
    status: statusFromRow(row.status, defaults.status, isAllowedStatus),
    og_image: textFromRow(fieldFromRow(row, "og_image"), defaults.og_image),
  };
}

type LoadSectionMetaArgs<T extends SectionMetaFields<string>> = {
  table: string;
  id: string;
  defaults: T;
  isAllowedStatus: (value: string) => value is T["status"];
  logLabel: string;
  /** 旧 ID の行が残っているとき（Diary の `notes` など）。 */
  fallback?: { id: string; logLabel: string };
  keepEmptyDescription?: boolean;
};

/** DB 行を読み、無ければコード上の既定値にフォールバックする。 */
export async function loadSectionMeta<T extends SectionMetaFields<string>>(
  args: LoadSectionMetaArgs<T>,
): Promise<T> {
  let row = await fetchSectionMetaRow(args.table, args.id, args.logLabel);
  if (!row && args.fallback) {
    row = await fetchSectionMetaRow(
      args.table,
      args.fallback.id,
      args.fallback.logLabel,
    );
  }
  return overlaySectionMetaFields(args.defaults, row, args.isAllowedStatus, {
    keepEmptyDescription: args.keepEmptyDescription,
  });
}

export async function listMappedPublic<TId extends string, T>(
  ids: TId[],
  load: (id: TId) => Promise<T>,
  isPublic: (item: T) => boolean,
): Promise<T[]> {
  const items = await Promise.all(ids.map((id) => load(id)));
  return items.filter(isPublic);
}

export function requirePublicOrNotFound<T>(
  item: T,
  isPublic: (item: T) => boolean,
): T {
  if (!isPublic(item)) notFound();
  return item;
}
