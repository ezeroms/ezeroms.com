import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  archiveProject,
  getProject,
  updateProject,
} from "@/lib/workspace/projects";
import { isProjectStatus } from "@/types/workspace";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const item = await getProject(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load project" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getProject(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      status?: string;
    };

    if (body.status !== undefined && !isProjectStatus(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const item = await updateProject(id, {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.status !== undefined && isProjectStatus(body.status)
        ? { status: body.status }
        : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getProject(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await archiveProject(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to archive project" },
      { status: 500 },
    );
  }
}
