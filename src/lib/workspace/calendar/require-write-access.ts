import { NextResponse } from "next/server";
import { tokenHasCalendarWriteScope } from "@/lib/workspace/calendar/oauth";
import {
  getStoredGoogleToken,
  type StoredGoogleToken,
} from "@/lib/workspace/calendar/tokens";

type WriteAuthSuccess = {
  token: StoredGoogleToken;
  error?: undefined;
};

type WriteAuthFailure = {
  token?: undefined;
  error: NextResponse;
};

/**
 * Google カレンダー書き込み系 API 共通の前提チェック。
 * 未接続 / 書き込みスコープ不足を同じメッセージで返す。
 */
export async function requireGoogleCalendarWriteAccess(): Promise<
  WriteAuthSuccess | WriteAuthFailure
> {
  const token = await getStoredGoogleToken();
  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Googleカレンダーが未接続です" },
        { status: 400 },
      ),
    };
  }
  if (!tokenHasCalendarWriteScope(token.scope)) {
    return {
      error: NextResponse.json(
        {
          error:
            "書き込み権限がありません。カレンダー連携を一度解除して、再接続してください",
          needsReconnect: true,
        },
        { status: 403 },
      ),
    };
  }
  return { token };
}
