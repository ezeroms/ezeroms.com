import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { createTask, listTasks, type TaskListFilter } from "@/lib/workspace/tasks";
import {
  isTaskPriority,
  isTaskStatus,
  type TaskStatus,
} from "@/types/workspace";

const VIEWS = new Set([
  "inbox",
  "today",
  "upcoming",
  "overdue",
  "completed",
  "all",
]);

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const viewRaw = sp.get("view") ?? undefined;
    const statusRaw = sp.get("status") ?? undefined;
    const filter: TaskListFilter = {
      includeArchived: sp.get("include_archived") === "1",
      projectId: sp.get("project_id") ?? undefined,
      scheduledDate: sp.get("scheduled_date") ?? undefined,
      scheduledAtFrom: sp.get("scheduled_at_from") ?? undefined,
      scheduledAtTo: sp.get("scheduled_at_to") ?? undefined,
      limit: Number(sp.get("limit") ?? 100) || 100,
    };
    if (viewRaw && VIEWS.has(viewRaw)) {
      filter.view = viewRaw as TaskListFilter["view"];
    }
    if (statusRaw && isTaskStatus(statusRaw)) {
      filter.status = statusRaw;
    }

    const items = await listTasks(filter);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list tasks" },
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
      body_md?: string | null;
      status?: string;
      priority?: string;
      project_id?: string | null;
      scheduled_date?: string | null;
      scheduled_at?: string | null;
      due_at?: string | null;
      estimated_minutes?: number | null;
    };

    const title = body.title?.trim();
    if (!title) {
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
      body.scheduled_at != null &&
      (typeof body.scheduled_at !== "string" ||
        Number.isNaN(Date.parse(body.scheduled_at)))
    ) {
      return NextResponse.json(
        { error: "scheduled_at must be an ISO datetime" },
        { status: 400 },
      );
    }

    const item = await createTask({
      title,
      body_md: body.body_md ?? null,
      status: (body.status as TaskStatus | undefined) ?? "inbox",
      priority:
        body.priority && isTaskPriority(body.priority)
          ? body.priority
          : "none",
      project_id: body.project_id ?? null,
      scheduled_date: body.scheduled_date ?? null,
      scheduled_at: body.scheduled_at ?? null,
      due_at: body.due_at ?? null,
      estimated_minutes: body.estimated_minutes ?? null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create task" },
      { status: 500 },
    );
  }
}
