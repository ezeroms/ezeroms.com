import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { archiveDoc, getDoc, updateDoc } from "@/lib/workspace/docs";
import { isDocStatus, parseDocTags } from "@/types/workspace";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const item = await getDoc(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load doc" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getDoc(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      body_md?: string;
      status?: string;
      tags?: string | string[] | null;
      project_id?: string | null;
      occurred_at?: string | null;
      review_at?: string | null;
    };

    if (body.status !== undefined && !isDocStatus(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const item = await updateDoc(id, {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.body_md !== undefined ? { body_md: body.body_md } : {}),
      ...(body.status !== undefined && isDocStatus(body.status)
        ? { status: body.status }
        : {}),
      ...(body.tags !== undefined ? { tags: parseDocTags(body.tags) } : {}),
      ...(body.project_id !== undefined ? { project_id: body.project_id } : {}),
      ...(body.occurred_at !== undefined
        ? { occurred_at: body.occurred_at }
        : {}),
      ...(body.review_at !== undefined ? { review_at: body.review_at } : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update doc" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getDoc(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await archiveDoc(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to archive doc" },
      { status: 500 },
    );
  }
}
