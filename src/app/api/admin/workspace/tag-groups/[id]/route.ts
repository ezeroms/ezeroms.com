import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  deleteTagGroup,
  getTagGroup,
  moveTagGroup,
  updateTagGroup,
} from "@/lib/workspace/tag-catalog";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getTagGroup(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = (await request.json()) as {
      name?: string;
      move?: "up" | "down";
    };
    if (body.move === "up" || body.move === "down") {
      const catalog = await moveTagGroup(id, body.move === "up" ? -1 : 1);
      return NextResponse.json(catalog);
    }
    const item = await updateTagGroup(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update group" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getTagGroup(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteTagGroup(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete group" },
      { status: 400 },
    );
  }
}
