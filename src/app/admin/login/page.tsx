"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin/workspace/";
  const configError = search.get("error") === "missing-anon-key";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    configError
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。.env.local に anon key を追加してサーバーを再起動してください。"
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }
      router.replace(
        next.startsWith("/admin") ? next : "/admin/workspace/",
      );
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-6 pt-[12vh]">
      <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Admin ログイン</CardTitle>
          <CardDescription>
            Supabase Auth のユーザーID（メール）とパスワードで入ってください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-email">ユーザーID（メール）</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password">パスワード</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "ログイン中…" : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-start justify-center px-6 pt-[12vh] text-sm text-muted-foreground">
          読み込み中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
