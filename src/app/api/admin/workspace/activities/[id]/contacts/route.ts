import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  getActivity,
  setActivityContacts,
} from "@/lib/workspace/activities";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getActivity(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      contact_ids?: unknown;
      friend_ids?: unknown;
    };
    const raw = Array.isArray(body.contact_ids)
      ? body.contact_ids
      : Array.isArray(body.friend_ids)
        ? body.friend_ids
        : null;
    if (!raw) {
      return NextResponse.json(
        { error: "contact_ids must be an array" },
        { status: 400 },
      );
    }
    const contactIds = raw.filter(
      (v): v is string => typeof v === "string" && Boolean(v),
    );
    const contacts = await setActivityContacts(id, contactIds);
    return NextResponse.json({
      contacts: contacts.filter((c) => !c.deleted_at),
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Failed to update activity contacts",
      },
      { status: 500 },
    );
  }
}
