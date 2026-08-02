import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  deleteWorkBlock,
  getWorkBlock,
  updateWorkBlock,
} from "@/lib/workspace/work-blocks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const item = await getWorkBlock(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to get work block" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      starts_at?: string;
      ends_at?: string;
      calendar_link_id?: string | null;
      note_md?: string | null;
    };

    if (
      body.starts_at !== undefined &&
      (typeof body.starts_at !== "string" ||
        Number.isNaN(Date.parse(body.starts_at)))
    ) {
      return NextResponse.json(
        { error: "starts_at must be an ISO datetime" },
        { status: 400 },
      );
    }
    if (
      body.ends_at !== undefined &&
      (typeof body.ends_at !== "string" ||
        Number.isNaN(Date.parse(body.ends_at)))
    ) {
      return NextResponse.json(
        { error: "ends_at must be an ISO datetime" },
        { status: 400 },
      );
    }

    const item = await updateWorkBlock(id, {
      ...(body.starts_at !== undefined ? { startsAt: body.starts_at } : {}),
      ...(body.ends_at !== undefined ? { endsAt: body.ends_at } : {}),
      ...(body.calendar_link_id !== undefined
        ? { calendarLinkId: body.calendar_link_id }
        : {}),
      ...(body.note_md !== undefined ? { noteMd: body.note_md } : {}),
    });
    return NextResponse.json({ item });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update";
    const status = message === "Not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    await deleteWorkBlock(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete";
    const status = message === "Not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}