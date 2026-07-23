import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminClipsEditPage({ params }: PageProps) {
  await params;
  redirect("/admin/clips/");
}
