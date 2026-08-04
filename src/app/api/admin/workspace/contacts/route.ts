import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  hasContactChildrenPayload,
  readContactBody,
  readContactChildren,
} from "@/lib/workspace/contact-api";
import { createContact, listContacts } from "@/lib/workspace/contacts";
import { contactHasIdentity } from "@/types/contacts";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const isFriendParam = sp.get("is_friend");
    const items = await listContacts({
      includeDeleted: sp.get("include_deleted") === "1",
      isFriend:
        isFriendParam === "1"
          ? true
          : isFriendParam === "0"
            ? false
            : undefined,
      q: sp.get("q") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      limit: Number(sp.get("limit") ?? 200) || 200,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list contacts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = readContactBody(body);
    if (
      !contactHasIdentity({
        family_name: input.family_name ?? null,
        given_name: input.given_name ?? null,
        english_name: input.english_name ?? null,
        nickname: input.nickname ?? null,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "苗字・名前・イングリッシュネーム・ニックネームのいずれかは必須です",
        },
        { status: 400 },
      );
    }
    if (
      input.birthday != null &&
      !/^\d{4}-\d{2}-\d{2}$/.test(input.birthday)
    ) {
      return NextResponse.json(
        { error: "birthday must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const children = hasContactChildrenPayload(body)
      ? readContactChildren(body)
      : {};
    const item = await createContact(input, children);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create contact" },
      { status: 500 },
    );
  }
}
