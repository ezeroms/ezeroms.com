import { Alert } from "@/components/ui/alert";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";

/** Shown on Workspace pages when no Supabase credentials are available. */
export function WorkspaceConfigNotice() {
  if (hasWorkspaceConfig()) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      Workspace 用の DB 接続がありません。.env.local に{" "}
      <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
      <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
      を設定し、Workspace migration を適用してください（ENV_SETUP.md 参照）。
    </Alert>
  );
}
