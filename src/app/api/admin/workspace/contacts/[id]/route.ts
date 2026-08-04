import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { listActivities } from "@/lib/workspace/activities";
import {
  hasContactChildrenPayload,
  readContactBody,
  readContactChildren,
} from "@/lib/workspace/contact-api";
import {
  getContact,
  getContactDetail,
  softDeleteContact,
  updateContact,
} from "@/lib/workspace/contacts";
import { contactHasIdentity } from "@/types/contacts";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const item = await getContactDetail(id);
    if (!item || item.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const activities = await listActivities({ contactId: id, limit: 100 });
    return NextResponse.json({ item, activities });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load contact" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getContact(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const input = readContactBody(body);
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
    if (!contactHasIdentity(merged)) {
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
      : undefined;
    const item = await updateContact(id, input, children);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update contact" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const existing = await getContact(id);
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const item = await softDeleteContact(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete contact" },
      { status: 500 },
    );
  }
}
