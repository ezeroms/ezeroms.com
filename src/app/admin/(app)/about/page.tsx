import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/about/")!;

export default function AdminAboutPage() {
  return <AdminComingSoon item={item} />;
}
