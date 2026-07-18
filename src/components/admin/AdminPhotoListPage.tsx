import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminPhotoListTable,
  type AdminPhotoTableItem,
} from "@/components/admin/AdminPhotoListTable";
import { PhotoCreateButton } from "@/components/admin/PhotoCreateButton";
import { PhotoGallerySettingsModal } from "@/components/admin/PhotoGallerySettingsModal";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { filenameFromImageUrl } from "@/lib/media/photo-name";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { resolvePhotoDbTable } from "@/lib/content/photo-db";
import { loadPhotoGallery } from "@/lib/content/queries/photo-gallery-meta";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

function mapRows(data: Record<string, unknown>[] | null): AdminPhotoTableItem[] {
  return (data ?? [])
    .filter((row) => row.is_deleted !== true)
    .map((row) => {
    const slug = String(row.slug ?? "");
    const date = String(row.date ?? "");
    const status = String(row.status ?? "published");
    const image_url = (row.image_url as string | null) ?? null;
    const image_thumb_url = (row.image_thumb_url as string | null) ?? null;
    const location = (row.location as string | null) ?? null;
    const camera = (row.camera as string | null) ?? null;
    const filename = image_url ? filenameFromImageUrl(image_url) : slug;

    return {
      slug,
      filename,
      date,
      status,
      image_url,
      image_thumb_url,
      location,
      camera,
      editor: {
        slug,
        filename,
        date,
        location: location ?? "",
        camera: camera ?? "",
        image_url: image_url ?? "",
        image_thumb_url: image_thumb_url ?? "",
        caption: htmlToEditableMarkdown(
          (row.body_html as string | null) ?? "",
        ),
        status: status === "draft" ? "draft" : "published",
      },
    };
  });
}

export async function AdminPhotoListPage({
  galleryId,
}: {
  galleryId: PhotoGalleryId;
}) {
  await getSessionUser();
  const gallery = await loadPhotoGallery(galleryId);

  let items: AdminPhotoTableItem[] = [];
  let usingLegacySnap = false;
  let loadError: string | null = null;

  if (hasSupabaseConfig()) {
    const resolved = await resolvePhotoDbTable(galleryId);
    usingLegacySnap = resolved.usingLegacySnap;

    const { data, error } = await getSupabaseAdmin()
      .from(resolved.table)
      .select("*")
      .eq("is_deleted", false)
      .order("date", { ascending: false })
      .limit(200);

    if (error) {
      loadError = error.message;
    } else {
      items = mapRows((data ?? []) as Record<string, unknown>[]);
    }
  } else {
    loadError = "Supabase が設定されていません（.env.local を確認してください）";
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={gallery.label}
        actions={
          <div className="flex flex-wrap gap-2">
            <PhotoGallerySettingsModal
              galleryId={galleryId}
              initialLabel={gallery.label}
              initialDescription={gallery.description}
              initialStatus={gallery.status}
            />
            <PhotoCreateButton galleryId={galleryId} />
          </div>
        }
      />

      {usingLegacySnap ? (
        <Alert className="mb-4">
          旧テーブル <code>snap</code> のデータを表示しています。正式な{" "}
          <code>smile</code> / <code>jumpai</code> / <code>kuikake</code>{" "}
          テーブルを作るには、Supabase SQL Editor で{" "}
          <code>supabase/migrations/20260719030000_photo_galleries_safe.sql</code>{" "}
          を実行し、続けて{" "}
          <code>npx tsx scripts/admin/setup-photo-galleries.ts</code>{" "}
          を実行してください。
        </Alert>
      ) : null}

      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          読み込みエラー: {loadError}
          {galleryId !== "smile" ? (
            <>
              {" "}
              — テーブル <code>{gallery.table}</code> が未作成の可能性があります。
              SQL マイグレーション{" "}
              <code>20260719030000_photo_galleries_safe.sql</code>{" "}
              を適用してください。
            </>
          ) : null}
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <AdminPhotoListTable
            galleryId={galleryId}
            basePath={gallery.basePath}
            items={items}
            empty={!items.length && !loadError}
          />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
