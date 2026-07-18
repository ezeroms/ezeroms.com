import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  ClipsEditorForm,
  type ClipsEditorInitial,
} from "@/components/admin/ClipsEditorForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminClipsEditPage({ params }: PageProps) {
  await getSessionUser();
  const { slug } = await params;

  if (!hasSupabaseConfig()) {
    notFound();
  }

  const { data, error } = await getSupabaseAdmin()
    .from("clip")
    .select(
      "slug, title, source_url, date, memo, clip_tag, og_image, og_description, status",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const initial: ClipsEditorInitial = {
    slug: data.slug as string,
    title: data.title as string,
    source_url: data.source_url as string,
    date: data.date as string,
    memo: (data.memo as string) ?? "",
    tags: ((data.clip_tag as string[] | null) ?? []).join(", "),
    status: data.status === "draft" ? "draft" : "published",
    og_image: (data.og_image as string) ?? "",
    og_description: (data.og_description as string) ?? "",
  };

  return (
    <AdminContent>
      <AdminPageHeader
        title="Clips を編集"
        description={initial.title}
        actions={
          <Button asChild variant="outline" size="sm">
            <a href={initial.source_url} target="_blank" rel="noopener noreferrer">
              出典を開く
            </a>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>編集</CardTitle>
          <CardDescription>
            <Link href="/admin/clips/" className="underline">
              一覧へ戻る
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClipsEditorForm initial={initial} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
