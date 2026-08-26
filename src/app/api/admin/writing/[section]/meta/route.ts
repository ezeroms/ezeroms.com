import { NextRequest, NextResponse } from "next/server";
import { applySectionPageSettingsPatch } from "@/lib/admin/section-page-settings";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  getWritingSection,
  isWritingSectionStatus,
  resolveWritingSectionId,
} from "@/lib/content/writing-sections";

type RouteParams = { params: Promise<{ section: string }> };

/**
 * PATCH /api/admin/writing/[section]/meta/
 * Writing セクションのページ設定（タイトル・説明文・公開状態・OGP）を更新する。
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { section } = await params;
  const sectionId = resolveWritingSectionId(section);
  if (!sectionId) {
    return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  }

  try {
    return await applySectionPageSettingsPatch({
      body: await request.json(),
      table: "writing_section",
      id: sectionId,
      defaults: getWritingSection(sectionId),
      isAllowedStatus: isWritingSectionStatus,
      formatError: (message) =>
        /writing_section|schema cache|does not exist/i.test(message)
          ? "writing_section がありません。Supabase SQL Editor で supabase/migrations/20260729120000_section_og_image.sql を実行してください。"
          : message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
