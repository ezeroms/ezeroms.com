import { NextRequest, NextResponse } from "next/server";
import { applySectionPageSettingsPatch } from "@/lib/admin/section-page-settings";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  getLibrarySection,
  isLibrarySectionId,
  isLibrarySectionStatus,
} from "@/lib/content/library-sections";

type RouteParams = { params: Promise<{ section: string }> };

/**
 * PATCH /api/admin/library/[section]/meta/
 * Library セクションのページ設定（タイトル・説明文・公開状態・OGP）を更新する。
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { section: sectionId } = await params;
  if (!isLibrarySectionId(sectionId)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  }

  try {
    return await applySectionPageSettingsPatch({
      body: await request.json(),
      table: "library_section",
      id: sectionId,
      defaults: getLibrarySection(sectionId),
      isAllowedStatus: isLibrarySectionStatus,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
