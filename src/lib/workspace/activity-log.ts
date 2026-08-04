import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";

export type ActivityLogActor = "user" | "ai" | "sync";

/**
 * workspace の監査ログ（activity_log テーブル）へ追記する。
 * Contacts / 「Activities」機能とは別物なので、モジュール名も activity-log としている。
 */
export async function logActivity(input: {
  entityType: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  actor?: ActivityLogActor;
}): Promise<void> {
  const { error } = await getWorkspaceAdmin().from("activity_log").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    before_json: input.before ?? null,
    after_json: input.after ?? null,
    actor: input.actor ?? "user",
  });
  if (error) {
    // 主処理を落とさない（監査ログ失敗は握りつぶして記録のみ）
    console.error("[activity_log]", error.message);
  }
}
