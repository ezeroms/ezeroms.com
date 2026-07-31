import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  getFriend,
  softDeleteFriend,
  updateFriend,
  type FriendWriteInput,
} from "@/lib/workspace/friends";
import { listActivities } from "@/lib/workspace/activities";
import { friendHasIdentity } from "@/types/friends";

type RouteParams = { params: Promise<{ id: string }> };

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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const item = await getFriend(id);
    if (!item || item.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const activities = await listActivities({ friendId: id, limit: 100 });
    return NextResponse.json({ item, activities });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load friend" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getFriend(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const input = readFriendBody(body);
    const merged = {
      family_name:
        input.family_name !== undefined
          ? input.family_name
          : existing.family_name,
      given_name:
        input.given_name !== undefined ? input.given_name : existing.given_name,
      english_name:
        input.english_name !== undefined
          ? input.english_name
          : existing.english_name,
      nickname:
        input.nickname !== undefined ? input.nickname : existing.nickname,
    };
    if (!friendHasIdentity(merged)) {
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

    const item = await updateFriend(id, input);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update friend" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getFriend(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await softDeleteFriend(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete friend" },
      { status: 500 },
    );
  }
}
