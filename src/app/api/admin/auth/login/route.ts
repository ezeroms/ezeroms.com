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
        { error: "Enter your email and password" },
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
        { error: "Sign-in failed. Check your email or password." },
        { status: 401 },
      );
    }

    if (!isAdminEmail(data.user?.email)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account cannot access the admin" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: { id: data.user?.id, email: data.user?.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Sign-in failed" },
      { status: 500 },
    );
  }
}
