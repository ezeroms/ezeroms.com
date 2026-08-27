import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWorkspaceDocDetailPage({
  params,
}: PageProps) {
  await requireAdminPage();
  const { id } = await params;
  redirect(`/admin/workspace/docs/?doc=${encodeURIComponent(id)}`);
}
