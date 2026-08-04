import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  createActivity,
  listActivities,
  setActivityContacts,
  type ActivityWriteInput,
} from "@/lib/workspace/activities";
import { isActivityTitleSource } from "@/types/contacts";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const items = await listActivities({
      contactId: sp.get("contact_id") ?? sp.get("friend_id") ?? undefined,
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      includeDeleted: sp.get("include_deleted") === "1",
      limit: Number(sp.get("limit") ?? 100) || 100,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list activities" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      title?: string;
      title_source?: string;
      occurred_at?: string | null;
      ended_at?: string | null;
      what_md?: string | null;
      notes_md?: string | null;
      location?: string | null;
      tags?: string | string[] | null;
      contact_ids?: string[];
      friend_ids?: string[];
    };

    const title = body.title?.trim();
    if (!title) {
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

    const input: ActivityWriteInput = {
      title,
      title_source: isActivityTitleSource(body.title_source)
        ? body.title_source
        : "manual",
      occurred_at: body.occurred_at ?? null,
      ended_at: body.ended_at ?? null,
      what_md: body.what_md ?? null,
      notes_md: body.notes_md ?? null,
      location: body.location ?? null,
      tags: body.tags ?? null,
    };

    const item = await createActivity(input);
    const contactIds = Array.isArray(body.contact_ids)
      ? body.contact_ids
      : Array.isArray(body.friend_ids)
        ? body.friend_ids
        : null;
    if (contactIds && contactIds.length > 0) {
      await setActivityContacts(item.id, contactIds);
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create activity" },
      { status: 500 },
    );
  }
}
