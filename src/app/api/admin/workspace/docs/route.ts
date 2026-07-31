import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { createDoc, listDocs } from "@/lib/workspace/docs";
import { isDocStatus, type DocStatus } from "@/types/workspace";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const statusRaw = sp.get("status") ?? undefined;
    const items = await listDocs({
      includeArchived: sp.get("include_archived") === "1",
      projectId: sp.get("project_id") ?? undefined,
      q: sp.get("q") ?? undefined,
      limit: Number(sp.get("limit") ?? 100) || 100,
      ...(statusRaw && isDocStatus(statusRaw) ? { status: statusRaw } : {}),
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list docs" },
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
      body_md?: string;
      status?: string;
      project_id?: string | null;
      occurred_at?: string | null;
      review_at?: string | null;
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (body.status !== undefined && !isDocStatus(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const item = await createDoc({
      title,
      body_md: body.body_md ?? "",
      status: (body.status as DocStatus | undefined) ?? "inbox",
      project_id: body.project_id ?? null,
      occurred_at: body.occurred_at ?? null,
      review_at: body.review_at ?? null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create doc" },
      { status: 500 },
    );
  }
}
