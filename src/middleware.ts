import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdmin =
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/admin/");

  if (isAdmin) {
    return updateSession(request);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * API（とくに multipart アップロード）は middleware を通すと
     * ボディが壊れて formData() が失敗することがあるため除外する。
     * 認証は各 route の getSessionUser() 側で行う。
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
