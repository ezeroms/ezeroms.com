import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { createProject, listProjects } from "@/lib/workspace/projects";
import { isProjectStatus } from "@/types/workspace";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const includeArchived =
      request.nextUrl.searchParams.get("include_archived") === "1";
    const items = await listProjects({ includeArchived });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      status?: string;
    };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (body.status !== undefined && !isProjectStatus(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const item = await createProject({
      name,
      description: body.description ?? null,
      status: body.status && isProjectStatus(body.status) ? body.status : "active",
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create project" },
      { status: 500 },
    );
  }
}
