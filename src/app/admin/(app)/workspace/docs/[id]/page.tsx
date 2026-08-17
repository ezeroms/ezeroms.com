import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWorkspaceDocDetailPage({
  params,
}: PageProps) {
  await getSessionUser();
  const { id } = await params;
  redirect(`/admin/workspace/docs/?doc=${encodeURIComponent(id)}`);
}
