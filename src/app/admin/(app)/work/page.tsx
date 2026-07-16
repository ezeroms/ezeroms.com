import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/work/")!;

export default function AdminWorkPage() {
  return <AdminComingSoon item={item} />;
}
