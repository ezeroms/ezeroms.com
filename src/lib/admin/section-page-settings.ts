/**
 * 管理画面「ページ設定」の PATCH ボディを読む／保存する。
 * Library / Writing / Works の meta API で同じ形を使う。
 */

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const SELECT_COLS = "id, label, description, status, og_image";

export type SectionPageSettingsPatch<TStatus extends string> = {
  label: string;
  /** 未送信なら undefined（既存の description を触らない） */
  description: string | undefined;
  status: TStatus;
  ogImage: string;
};

export function parseSectionPageSettingsPatch<TStatus extends string>(
  body: unknown,
  defaults: { label: string; status: TStatus },
  isAllowedStatus: (value: string) => value is TStatus,
): SectionPageSettingsPatch<TStatus> {
  const raw =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const rawLabel = typeof raw.label === "string" ? raw.label.trim() : "";
  const label = rawLabel || defaults.label;

  const description =
    typeof raw.description === "string" ? raw.description.trim() : undefined;

  const rawStatus = typeof raw.status === "string" ? raw.status : "";
  const status = isAllowedStatus(rawStatus) ? rawStatus : defaults.status;

  const ogImage = typeof raw.og_image === "string" ? raw.og_image.trim() : "";

  return { label, description, status, ogImage };
}

/** 既存行があれば update、無ければ insert。Photo は upsert 形が違うので使わない。 */
export async function upsertSectionPageSettingsRow(input: {
  table: string;
  id: string;
  parsed: SectionPageSettingsPatch<string>;
  defaultDescription: string;
}): Promise<{ data: unknown; error: { message: string } | null }> {
  const now = new Date().toISOString();
  const row = {
    id: input.id,
    label: input.parsed.label,
    status: input.parsed.status,
    og_image: input.parsed.ogImage,
    updated_at: now,
    ...(input.parsed.description !== undefined
      ? { description: input.parsed.description }
      : {}),
  };

  const db = getSupabaseAdmin();
  const { data: existing } = await db
    .from(input.table)
    .select("id")
    .eq("id", input.id)
    .maybeSingle();

  const query = existing?.id
    ? db
        .from(input.table)
        .update(row)
        .eq("id", input.id)
        .select(SELECT_COLS)
        .single()
    : db
        .from(input.table)
        .insert({
          ...row,
          description: input.parsed.description ?? input.defaultDescription,
        })
        .select(SELECT_COLS)
        .single();

  const { data, error } = await query;
  return { data, error };
}

/** PATCH ボディを読んで保存し、公開・管理・トップを再検証する。 */
export async function applySectionPageSettingsPatch<TStatus extends string>(input: {
  body: unknown;
  table: string;
  id: string;
  defaults: {
    label: string;
    description: string;
    status: TStatus;
    basePath: string;
    adminPath: string;
  };
  isAllowedStatus: (value: string) => value is TStatus;
  formatError?: (message: string) => string;
}): Promise<NextResponse> {
  const parsed = parseSectionPageSettingsPatch(
    input.body,
    { label: input.defaults.label, status: input.defaults.status },
    input.isAllowedStatus,
  );
  const { data, error } = await upsertSectionPageSettingsRow({
    table: input.table,
    id: input.id,
    parsed,
    defaultDescription: input.defaults.description,
  });
  if (error) {
    const message = input.formatError
      ? input.formatError(error.message)
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  revalidatePath(input.defaults.basePath);
  revalidatePath(input.defaults.adminPath);
  revalidatePath("/");

  return NextResponse.json({ ok: true, item: data });
}
