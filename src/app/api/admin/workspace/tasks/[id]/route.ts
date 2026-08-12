import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { archiveTask, getTask, updateTask } from "@/lib/workspace/tasks";
import { isTaskPriority, isTaskStatus } from "@/types/workspace";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const item = await getTask(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load task" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getTask(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      body_md?: string | null;
      status?: string;
      priority?: string;
      project_id?: string | null;
      scheduled_date?: string | null;
      scheduled_at?: string | null;
      due_at?: string | null;
      estimated_minutes?: number | null;
      progress_percent?: number | null;
    };

    if (body.title !== undefined && !body.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (body.status !== undefined && !isTaskStatus(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    if (body.priority !== undefined && !isTaskPriority(body.priority)) {
      return NextResponse.json({ error: "invalid priority" }, { status: 400 });
    }
    if (
      body.estimated_minutes != null &&
      (!Number.isFinite(body.estimated_minutes) || body.estimated_minutes <= 0)
    ) {
      return NextResponse.json(
        { error: "estimated_minutes must be a positive number" },
        { status: 400 },
      );
    }
    if (
      body.progress_percent != null &&
      (!Number.isFinite(body.progress_percent) ||
        body.progress_percent < 0 ||
        body.progress_percent > 100)
    ) {
      return NextResponse.json(
        { error: "progress_percent must be 0–100" },
        { status: 400 },
      );
    }
    if (
      body.scheduled_at != null &&
      (typeof body.scheduled_at !== "string" ||
        Number.isNaN(Date.parse(body.scheduled_at)))
    ) {
      return NextResponse.json(
        { error: "scheduled_at must be an ISO datetime" },
        { status: 400 },
      );
    }

    const item = await updateTask(id, {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.body_md !== undefined ? { body_md: body.body_md } : {}),
      ...(body.status !== undefined && isTaskStatus(body.status)
        ? { status: body.status }
        : {}),
      ...(body.priority !== undefined && isTaskPriority(body.priority)
        ? { priority: body.priority }
        : {}),
      ...(body.project_id !== undefined ? { project_id: body.project_id } : {}),
      ...(body.scheduled_date !== undefined
        ? { scheduled_date: body.scheduled_date }
        : {}),
      ...(body.scheduled_at !== undefined
        ? { scheduled_at: body.scheduled_at }
        : {}),
      ...(body.due_at !== undefined ? { due_at: body.due_at } : {}),
      ...(body.estimated_minutes !== undefined
        ? { estimated_minutes: body.estimated_minutes }
        : {}),
      ...(body.progress_percent !== undefined
        ? { progress_percent: body.progress_percent }
        : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getTask(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await archiveTask(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to archive task" },
      { status: 500 },
    );
  }
}
