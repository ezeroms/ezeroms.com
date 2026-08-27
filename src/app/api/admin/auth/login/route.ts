import { NextResponse } from "next/server";
import { createAuthClient, isAdminEmail } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "ユーザーIDとパスワードを入力してください" },
        { status: 400 },
      );
    }

    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return NextResponse.json(
        { error: "ログインに失敗しました。IDまたはパスワードを確認してください" },
        { status: 401 },
      );
    }

    if (!isAdminEmail(data.user?.email)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "このアカウントでは管理画面に入れません" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: { id: data.user?.id, email: data.user?.email },
    });
  } catch {
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 },
    );
  }
}
