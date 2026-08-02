import { redirect } from "next/navigation";

/** Legacy path → Me */
export default function AdminAboutRedirectPage() {
  redirect("/admin/me/");
}
