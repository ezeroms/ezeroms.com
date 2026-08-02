import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy Overview dashboard — Workspace is the admin home. */
export default function AdminIndexPage() {
  redirect("/admin/workspace/");
}
