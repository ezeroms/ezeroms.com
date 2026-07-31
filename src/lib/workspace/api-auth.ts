import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";

type AuthOk = { user: User; error?: undefined };
type AuthErr = { user?: undefined; error: NextResponse };

/** Admin session + Workspace DB config check for /api/admin/workspace/*. */
export async function requireWorkspaceAdmin(): Promise<AuthOk | AuthErr> {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!hasWorkspaceConfig()) {
    return {
      error: NextResponse.json(
        {
          error: "Workspace DB not configured",
          code: "WORKSPACE_NOT_CONFIGURED",
        },
        { status: 503 },
      ),
    };
  }
  return { user };
}
