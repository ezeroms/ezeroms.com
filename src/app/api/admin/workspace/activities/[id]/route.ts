import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  getActivityWithContacts,
  softDeleteActivity,
  updateActivity,
} from "@/lib/workspace/activities";
import { isActivityTitleSource } from "@/types/contacts";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const item = await getActivityWithContacts(id);
    if (!item || item.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load activity" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getActivityWithContacts(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      title_source?: string;
      occurred_at?: string | null;
      ended_at?: string | null;
      what_md?: string | null;
      notes_md?: string | null;
      location?: string | null;
      tags?: string | string[] | null;
    };

    if (body.title !== undefined && !body.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (
      body.title_source !== undefined &&
      !isActivityTitleSource(body.title_source)
    ) {
      return NextResponse.json(
        { error: "invalid title_source" },
        { status: 400 },
      );
    }

    const item = await updateActivity(id, {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.title_source !== undefined &&
      isActivityTitleSource(body.title_source)
        ? { title_source: body.title_source }
        : {}),
      ...(body.occurred_at !== undefined
        ? { occurred_at: body.occurred_at }
        : {}),
      ...(body.ended_at !== undefined ? { ended_at: body.ended_at } : {}),
      ...(body.what_md !== undefined ? { what_md: body.what_md } : {}),
      ...(body.notes_md !== undefined ? { notes_md: body.notes_md } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update activity" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getActivityWithContacts(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await softDeleteActivity(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete activity" },
      { status: 500 },
    );
  }
}
