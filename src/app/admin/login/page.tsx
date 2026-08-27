import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeAdminNextPath } from "@/lib/admin/safe-next-path";
import { getSessionUser } from "@/lib/supabase/auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    const sp = await searchParams;
    redirect(safeAdminNextPath(sp.next));
  }

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
