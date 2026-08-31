import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  createTagGroup,
  listTagGroups,
} from "@/lib/workspace/tag-catalog";

export async function GET() {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const items = await listTagGroups();
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list groups" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as { name?: string };
    const item = await createTagGroup(body.name ?? "");
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create group" },
      { status: 400 },
    );
  }
}
