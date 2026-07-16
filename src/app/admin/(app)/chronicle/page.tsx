import { AdminComingSoon } from "@/components/admin/AdminComingSoon";
import { flattenAdminNav } from "@/lib/admin/nav";

const item = flattenAdminNav().find((i) => i.href === "/admin/chronicle/")!;

export default function AdminChroniclePage() {
  return <AdminComingSoon item={item} />;
}
