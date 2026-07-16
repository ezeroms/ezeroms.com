import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  NotesEditorForm,
  type NotesEditorInitial,
} from "@/components/admin/NotesEditorForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminNotesEditPage({ params }: PageProps) {
  await getSessionUser();
  const { slug } = await params;

  if (!hasSupabaseConfig()) {
    notFound();
  }

  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select("slug, date, diary_tag, diary_place, status, body_html, body_md")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const status =
    data.status === "draft" ? "draft" : ("published" as const);
  const bodyMd =
    (data.body_md as string | null)?.trim() ||
    htmlToEditableMarkdown((data.body_html as string) ?? "");

  const initial: NotesEditorInitial = {
    slug: data.slug as string,
    body_md: bodyMd,
    date: data.date as string,
    tags: ((data.diary_tag as string[] | null) ?? []).join(", "),
    place: (data.diary_place as string | null) ?? "",
    status,
  };

  return (
    <>
      <AdminPageHeader
        title="Notes を編集"
        description={new Date(initial.date).toLocaleString("ja-JP")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/diary/${slug}/`}>公開ページ</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>編集</CardTitle>
          <CardDescription>Markdown で更新できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <NotesEditorForm initial={initial} />
        </CardContent>
      </Card>
    </>
  );
}
