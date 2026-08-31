import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  deleteTag,
  getTag,
  moveTag,
  updateTag,
} from "@/lib/workspace/tag-catalog";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getTag(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = (await request.json()) as {
      name?: string;
      group_id?: string | null;
      move?: "up" | "down";
    };
    if (body.move === "up" || body.move === "down") {
      const catalog = await moveTag(id, body.move === "up" ? -1 : 1);
      return NextResponse.json(catalog);
    }
    const item = await updateTag(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.group_id !== undefined ? { group_id: body.group_id } : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update tag" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getTag(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteTag(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete tag" },
      { status: 400 },
    );
  }
}
