import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeAdminNextPath } from "@/lib/admin/safe-next-path";

/** Vercel Edge middleware は 25s で 504 になる。余裕を残して切る。 */
const AUTH_FETCH_TIMEOUT_MS = 8_000;
/** 期限のこの秒数前から refresh を試みる。 */
const REFRESH_MARGIN_SEC = 60;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const passthrough = () =>
    NextResponse.next({
      request: { headers: requestHeaders },
    });

  const isLogin = pathname === "/admin/login" || pathname === "/admin/login/";
  const isAdmin =
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/admin/");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    if (isAdmin && !isLogin) {
      return redirectToLogin(request, pathname, "missing-anon-key");
    }
    return passthrough();
  }

  const hasSessionCookie = Boolean(authStorageKey(request));

  // 未ログインは Cookie だけで弾く（ネットワークなし）。
  if (isAdmin && !isLogin && !hasSessionCookie) {
    return redirectToLogin(request, pathname);
  }

  // 有効な access token があるあいだは Auth API を呼ばない。
  // ここが毎回 getUser() だと、Auth が遅いだけで 504 MIDDLEWARE_INVOCATION_TIMEOUT になる。
  if (!hasSessionCookie || !tokenNeedsRefresh(request)) {
    return passthrough();
  }

  return refreshSession(request, requestHeaders, url, anon);
}

function redirectToLogin(
  request: NextRequest,
  nextPath: string,
  error?: string,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/admin/login/";
  redirectUrl.search = "";
  if (error) {
    redirectUrl.searchParams.set("error", error);
  } else {
    redirectUrl.searchParams.set("next", safeAdminNextPath(nextPath));
  }
  return NextResponse.redirect(redirectUrl);
}

async function refreshSession(
  request: NextRequest,
  requestHeaders: Headers,
  url: string,
  anon: string,
) {
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS),
        }),
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // timeout / ネットワーク障害でも 504 にせずページへ進める。
    // 本認証は AdminShell 側（Node、制限 300s）で行う。
  }

  return response;
}

function authStorageKey(request: NextRequest): string | null {
  for (const { name } of request.cookies.getAll()) {
    const match = name.match(/^(sb-[a-z0-9]+-auth-token)(?:\.\d+)?$/i);
    if (match) return match[1];
  }
  return null;
}

function tokenNeedsRefresh(request: NextRequest): boolean {
  const token = readAccessToken(request);
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (typeof payload?.exp !== "number") return true;
  return payload.exp - Date.now() / 1000 < REFRESH_MARGIN_SEC;
}

function readAccessToken(request: NextRequest): string | null {
  const key = authStorageKey(request);
  if (!key) return null;
  const raw = combineAuthCookieValue(request, key);
  if (!raw) return null;
  const parsed = parseCookieValue(raw);
  if (!parsed || typeof parsed !== "object") return null;
  const token = (parsed as { access_token?: unknown }).access_token;
  return typeof token === "string" ? token : null;
}

function combineAuthCookieValue(
  request: NextRequest,
  storageKey: string,
): string | null {
  const direct = request.cookies.get(storageKey)?.value;
  if (direct) return direct;
  const parts: string[] = [];
  for (let i = 0; ; i += 1) {
    const chunk = request.cookies.get(`${storageKey}.${i}`)?.value;
    if (!chunk) break;
    parts.push(chunk);
  }
  return parts.length > 0 ? parts.join("") : null;
}

function parseCookieValue(raw: string): unknown {
  const decoded = raw.startsWith("base64-")
    ? fromBase64Url(raw.slice("base64-".length))
    : raw;
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(fromBase64Url(parts[1])) as { exp?: number };
  } catch {
    return null;
  }
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}
