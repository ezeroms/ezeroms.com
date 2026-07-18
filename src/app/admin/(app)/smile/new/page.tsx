import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PhotoEditorForm } from "@/components/admin/PhotoEditorForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPhotoGallery } from "@/lib/content/photo-galleries";

export const dynamic = "force-dynamic";

export default function AdminSmileNewPage() {
  const gallery = getPhotoGallery("smile");
  return (
    <>
      <AdminPageHeader
        title={`${gallery.label} に追加`}
        description="作品として見せたい写真を掲載します。"
      />
      <Card>
        <CardHeader>
          <CardTitle>新規写真</CardTitle>
          <CardDescription>{gallery.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoEditorForm galleryId="smile" />
        </CardContent>
      </Card>
    </>
  );
}
