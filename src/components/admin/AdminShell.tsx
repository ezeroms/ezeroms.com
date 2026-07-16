import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getSessionUser } from "@/lib/supabase/auth";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminSidebar userEmail={user?.email ?? null} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
