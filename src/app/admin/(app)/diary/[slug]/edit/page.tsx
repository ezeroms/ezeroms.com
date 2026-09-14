import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DiaryEditorForm,
  type DiaryEditorInitial,
} from "@/components/admin/DiaryEditorForm";
import { Button } from "@/components/ui/button";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { requireAdminPage } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminDiaryEditPage({ params }: PageProps) {
  await requireAdminPage();
  const { slug } = await params;

  if (!hasSupabaseConfig()) {
    notFound();
  }

  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select(
      "slug, date, diary_tag, og_image, status, body_html, body_md",
    )
    .eq("slug", slug)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const status =
    data.status === "draft" ? "draft" : ("published" as const);
  const bodyMd =
    (data.body_md as string | null)?.trim() ||
    htmlToEditableMarkdown((data.body_html as string) ?? "");

  const initial: DiaryEditorInitial = {
    slug: data.slug as string,
    body_md: bodyMd,
    date: data.date as string,
    tags: ((data.diary_tag as string[] | null) ?? []).join(", "),
    og_image: (data.og_image as string | null) ?? "",
    status,
  };

  return (
    <AdminContent>
      <AdminPageHeader
        title="Diary を編集"
        description={new Date(initial.date).toLocaleString("ja-JP")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/diary/${slug}/`}>公開ページ</Link>
          </Button>
        }
      />
      <DiaryEditorForm initial={initial} />
    </AdminContent>
  );
}
