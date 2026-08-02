import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  getActivity,
  setActivityFriends,
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

    const body = (await request.json()) as { friend_ids?: unknown };
    if (!Array.isArray(body.friend_ids)) {
      return NextResponse.json(
        { error: "friend_ids must be an array" },
        { status: 400 },
      );
    }
    const friendIds = body.friend_ids.filter(
      (v): v is string => typeof v === "string" && Boolean(v),
    );
    const friends = await setActivityFriends(id, friendIds);
    return NextResponse.json({
      friends: friends.filter((f) => !f.deleted_at),
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to update activity friends",
      },
      { status: 500 },
    );
  }
}
