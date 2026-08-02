import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  createWorkBlock,
  listWorkBlocksForTask,
  listWorkBlocksInRange,
} from "@/lib/workspace/work-blocks";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const taskId = sp.get("task_id");
    const timeMin = sp.get("time_min") ?? sp.get("from");
    const timeMax = sp.get("time_max") ?? sp.get("to");

    if (taskId) {
      const items = await listWorkBlocksForTask(taskId);
      return NextResponse.json({ items });
    }

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "task_id or time_min+time_max is required" },
        { status: 400 },
      );
    }
    if (Number.isNaN(Date.parse(timeMin)) || Number.isNaN(Date.parse(timeMax))) {
      return NextResponse.json(
        { error: "time_min / time_max must be ISO datetimes" },
        { status: 400 },
      );
    }

    const items = await listWorkBlocksInRange({
      timeMin,
      timeMax,
      limit: Number(sp.get("limit") ?? 400) || 400,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list work blocks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      task_id?: string;
      starts_at?: string;
      ends_at?: string;
      calendar_link_id?: string | null;
      note_md?: string | null;
    };

    const taskId = body.task_id?.trim();
    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }
    if (
      !body.starts_at ||
      !body.ends_at ||
      Number.isNaN(Date.parse(body.starts_at)) ||
      Number.isNaN(Date.parse(body.ends_at))
    ) {
      return NextResponse.json(
        { error: "starts_at and ends_at must be ISO datetimes" },
        { status: 400 },
      );
    }

    const item = await createWorkBlock({
      taskId,
      startsAt: body.starts_at,
      endsAt: body.ends_at,
      calendarLinkId: body.calendar_link_id,
      noteMd: body.note_md,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create work block" },
      { status: 500 },
    );
  }
}