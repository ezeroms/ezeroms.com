import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { getSessionUser } from "@/lib/supabase/auth";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div
      className="admin-app flex h-screen w-full overflow-hidden"
      {...ignorePasswordManagersProps}
    >
      <AdminSidebar userEmail={user?.email ?? null} />
      <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8">
        {/* 幅はページ側の AdminContent（default / wide）で指定 */}
        {children}
      </main>
    </div>
  );
}
