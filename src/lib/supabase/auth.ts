import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { safeAdminNextPath } from "@/lib/admin/safe-next-path";
import { isAdminEmail } from "@/lib/supabase/admin-email";

export { isAdminEmail } from "@/lib/supabase/admin-email";

export function hasAnonConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Cookie-based Supabase client (user session). */
export async function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Called from a Server Component — middleware will refresh. */
        }
      },
    },
  });
}

export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!hasAnonConfig()) return null;
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    if (!isAdminEmail(data.user.email)) return null;
    return data.user;
  } catch {
    // ネットワーク不通・不正な URL などで getUser が throw することがある
    // （TypeError: fetch failed）。ページ全体を落とさず未ログイン扱い。
    return null;
  }
});

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/** 管理画面ページ用。未ログインならログインへ。Auth API で検証する。 */
export async function requireAdminPage(): Promise<User> {
  const user = await getSessionUser();
  if (user) return user;
  const pathname = (await headers()).get("x-pathname") || "/admin/workspace/";
  redirect(`/admin/login/?next=${encodeURIComponent(safeAdminNextPath(pathname))}`);
}
