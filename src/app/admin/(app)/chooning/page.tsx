import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/chooning/")!;

export default function AdminChooningPage() {
  return <AdminComingSoon item={item} />;
}
