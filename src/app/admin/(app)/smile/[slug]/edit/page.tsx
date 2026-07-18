import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PhotoEditorForm } from "@/components/admin/PhotoEditorForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { getPhotoGallery } from "@/lib/content/photo-galleries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSmileEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await getSessionUser();
  const { slug } = await params;
  const gallery = getPhotoGallery("smile");

  if (!hasSupabaseConfig()) notFound();

  const { data, error } = await getSupabaseAdmin()
    .from("smile")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <>
      <AdminPageHeader
        title="写真を編集"
        description={data.title as string}
      />
      <Card>
        <CardHeader>
          <CardTitle>{gallery.label}</CardTitle>
          <CardDescription>/{slug}/</CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoEditorForm
            galleryId="smile"
            initial={{
              slug: data.slug as string,
              title: data.title as string,
              date: data.date as string,
              location: (data.location as string | null) ?? "",
              camera: (data.camera as string | null) ?? "",
              image_url: (data.image_url as string | null) ?? "",
              caption: htmlToEditableMarkdown(
                (data.body_html as string | null) ?? "",
              ),
              status:
                data.status === "draft" ? "draft" : "published",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
