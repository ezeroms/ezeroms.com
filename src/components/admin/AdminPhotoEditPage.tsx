import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
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
import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";
import { resolvePhotoDbTable } from "@/lib/content/photo-db";
import { filenameFromImageUrl } from "@/lib/media/photo-name";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type Props = {
  galleryId: PhotoGalleryId;
  slug: string;
};

/** 写真ギャラリー共通の「編集」画面。 */
export async function AdminPhotoEditPage({ galleryId, slug }: Props) {
  await getSessionUser();
  const gallery = getPhotoGallery(galleryId);

  if (!hasSupabaseConfig()) notFound();

  const { table } = await resolvePhotoDbTable(galleryId);
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .select("*")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) notFound();

  const imageUrl = (data.image_url as string | null) ?? "";
  const filename = imageUrl
    ? filenameFromImageUrl(imageUrl)
    : (data.slug as string);

  return (
    <AdminContent>
      <AdminPageHeader title="写真を編集" description={filename || slug} />
      <Card>
        <CardHeader>
          <CardTitle>{gallery.label}</CardTitle>
          <CardDescription>/{slug}/</CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoEditorForm
            galleryId={galleryId}
            initial={{
              slug: data.slug as string,
              filename,
              date: data.date as string,
              location: (data.location as string | null) ?? "",
              camera: (data.camera as string | null) ?? "",
              image_url: imageUrl,
              image_thumb_url: (data.image_thumb_url as string | null) ?? "",
              caption: htmlToEditableMarkdown(
                (data.body_html as string | null) ?? "",
              ),
              status: data.status === "draft" ? "draft" : "published",
            }}
          />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
