import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { deleteLink } from "@/lib/workspace/links";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    await deleteLink(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete link" },
      { status: 500 },
    );
  }
}
