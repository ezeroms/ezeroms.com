import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/top-images/")!;

export default function AdminTopImagesPage() {
  return <AdminComingSoon item={item} />;
}
