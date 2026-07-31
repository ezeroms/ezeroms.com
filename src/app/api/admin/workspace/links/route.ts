import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { createLink, listLinks } from "@/lib/workspace/links";
import {
  isItemLinkRelation,
  isItemLinkType,
  type ItemLinkType,
} from "@/types/workspace";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const typeRaw = sp.get("type");
    const id = sp.get("id") ?? undefined;
    const type =
      typeRaw && isItemLinkType(typeRaw) ? (typeRaw as ItemLinkType) : undefined;

    const items = await listLinks({
      type,
      id,
      limit: Number(sp.get("limit") ?? 100) || 100,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list links" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      from_type?: string;
      from_id?: string;
      to_type?: string;
      to_id?: string;
      relation?: string;
    };

    if (!isItemLinkType(body.from_type) || !isItemLinkType(body.to_type)) {
      return NextResponse.json(
        { error: "from_type and to_type must be doc|task|project" },
        { status: 400 },
      );
    }
    if (!body.from_id || !body.to_id) {
      return NextResponse.json(
        { error: "from_id and to_id are required" },
        { status: 400 },
      );
    }
    if (body.relation !== undefined && !isItemLinkRelation(body.relation)) {
      return NextResponse.json({ error: "invalid relation" }, { status: 400 });
    }

    const item = await createLink({
      from_type: body.from_type,
      from_id: body.from_id,
      to_type: body.to_type,
      to_id: body.to_id,
      relation:
        body.relation && isItemLinkRelation(body.relation)
          ? body.relation
          : "related",
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create link" },
      { status: 500 },
    );
  }
}
