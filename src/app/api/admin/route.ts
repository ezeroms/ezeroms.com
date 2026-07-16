import { NextRequest, NextResponse } from "next/server";

/**
 * Admin API stubs (Phase 6). Require Authorization: Bearer <REVALIDATE_SECRET>
 * until Supabase Auth is wired.
 */
function assertAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;
  return NextResponse.json({
    ok: true,
    message: "Admin API ready. CRUD endpoints land in Phase 6.",
    endpoints: [
      "GET /api/admin",
      "GET|POST|DELETE /api/admin/top-images",
      "POST /api/admin/[resource] (planned)",
      "PATCH /api/admin/[resource]/[id] (planned)",
      "DELETE /api/admin/[resource]/[id] (planned)",
    ],
  });
}
