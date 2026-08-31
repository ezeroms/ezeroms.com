import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  createTag,
  loadTagCatalog,
} from "@/lib/workspace/tag-catalog";
import { orderedTagNames } from "@/lib/workspace/tags";

export async function GET() {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const catalog = await loadTagCatalog();
    return NextResponse.json({
      tags: orderedTagNames(catalog.tags, catalog.groups),
      catalog: catalog.tags,
      groups: catalog.groups,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list tags" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      name?: string;
      group_id?: string | null;
    };
    const item = await createTag({
      name: body.name ?? "",
      group_id: body.group_id ?? null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create tag" },
      { status: 400 },
    );
  }
}
