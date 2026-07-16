import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/column/")!;

export default function AdminColumnPage() {
  return <AdminComingSoon item={item} />;
}
