import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/giants/")!;

export default function AdminGiantsPage() {
  return <AdminComingSoon item={item} />;
}
