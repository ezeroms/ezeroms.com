import { redirect } from "next/navigation";

/** Legacy path — Creative lives under /admin/creative/ */
export default function AdminWorkRedirectPage() {
  redirect("/admin/creative/");
}
