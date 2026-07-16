import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/media-coverage/")!;

export default function AdminMediaCoveragePage() {
  return <AdminComingSoon item={item} />;
}
