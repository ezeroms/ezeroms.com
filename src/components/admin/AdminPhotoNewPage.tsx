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
import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";

type Props = {
  galleryId: PhotoGalleryId;
};

/** 写真ギャラリー共通の「新規追加」画面。 */
export function AdminPhotoNewPage({ galleryId }: Props) {
  const gallery = getPhotoGallery(galleryId);
  return (
    <AdminContent>
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
          <PhotoEditorForm galleryId={galleryId} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
