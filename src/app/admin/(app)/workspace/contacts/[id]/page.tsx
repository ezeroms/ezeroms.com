import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Detail URLs open the list; editing is done in a modal from the list. */
export default async function AdminWorkspaceContactDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/admin/workspace/contacts/");
}
