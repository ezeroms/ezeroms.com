import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  createFriend,
  listFriends,
  type FriendWriteInput,
} from "@/lib/workspace/friends";
import { friendHasIdentity } from "@/types/friends";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const items = await listFriends({
      includeDeleted: sp.get("include_deleted") === "1",
      q: sp.get("q") ?? undefined,
      limit: Number(sp.get("limit") ?? 200) || 200,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list friends" },
      { status: 500 },
    );
  }
}

function readFriendBody(body: Record<string, unknown>): FriendWriteInput {
  const str = (k: string) =>
    body[k] === undefined
      ? undefined
      : body[k] == null
        ? null
        : String(body[k]);
  return {
    family_name: str("family_name"),
    given_name: str("given_name"),
    middle_name: str("middle_name"),
    family_name_kana: str("family_name_kana"),
    given_name_kana: str("given_name_kana"),
    middle_name_kana: str("middle_name_kana"),
    family_name_en: str("family_name_en"),
    given_name_en: str("given_name_en"),
    middle_name_en: str("middle_name_en"),
    english_name: str("english_name"),
    nickname: str("nickname"),
    birthday: str("birthday"),
    birthday_year_known:
      body.birthday_year_known === undefined
        ? undefined
        : Boolean(body.birthday_year_known),
    notes_md: str("notes_md"),
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = readFriendBody(body);
    if (
      !friendHasIdentity({
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

    const item = await createFriend(input);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create friend" },
      { status: 500 },
    );
  }
}
