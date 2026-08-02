import { notFound } from "next/navigation";
import { PhotoAdjacentNavCard } from "@/components/photos/PhotoAdjacentNavCard";
import { PhotoDetailLightboxTrigger } from "@/components/photos/PhotoDetailLightboxTrigger";
import { PhotoDetailMetaPanel } from "@/components/photos/PhotoDetailMetaPanel";
import { SiteShell } from "@/components/SiteShell";
import {
  findAdjacentPhotosInList,
  photoDetailHref,
} from "@/lib/content/photo-adjacent";
import { formatPhotoCaption } from "@/lib/content/photo-caption";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { formatPhotoDate } from "@/lib/content/photo-filter";
import {
  getPhotoBySlug,
  listPhotos,
  requirePublicPhotoGallery,
} from "@/lib/content/queries";
import type { Photo } from "@/types/content";

type Props = {
  galleryId: PhotoGalleryId;
  slug: string;
};

/**
 * 写真ギャラリーの詳細ページ（Smile / Jampai / Tabekake）。
 * デスクトップは左に写真・右にメタ情報。狭い幅では上下に積む。
 * タイトル・メモ（body_html）は公開 UI には出さない。
 */
export async function PhotoDetailPage({ galleryId, slug }: Props) {
  const gallery = await requirePublicPhotoGallery(galleryId);
  const photo = await getPhotoBySlug(galleryId, slug);
  if (!photo) notFound();

  const caption = formatPhotoCaption(photo);
  const imageAlt = caption || gallery.label;

  // ライトボックス前後ナビと隣接カードの両方で使うため、一覧を一度だけ取得する
  const listed = await listPhotos(galleryId).catch(() => ({
    items: [] as Photo[],
    total: 0,
  }));
  const { olderPhoto, newerPhoto } = findAdjacentPhotosInList(
    listed.items,
    slug,
  );

  const olderHref = olderPhoto
    ? photoDetailHref(gallery.basePath, olderPhoto.slug)
    : null;
  const newerHref = newerPhoto
    ? photoDetailHref(gallery.basePath, newerPhoto.slug)
    : null;

  return (
    <SiteShell
      bodyClassName={`is-${galleryId}`}
      breadcrumbCurrent={caption || undefined}
      contentClassName="p-4 min-[768px]:p-5 min-[1080px]:p-6"
    >
      <article className="mx-auto w-full max-w-6xl font-sans text-foreground">
        <div className="flex flex-col gap-4 min-[768px]:flex-row min-[768px]:items-start min-[768px]:gap-4">
          <div className="min-w-0 flex-1">
            <PhotoDetailLightboxTrigger
              photo={photo}
              photos={listed.items}
              detailBasePath={gallery.basePath}
              imageAlt={imageAlt}
            />
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 min-[768px]:w-72 min-[1080px]:w-80">
            <PhotoDetailMetaPanel
              dateLabel={formatPhotoDate(photo.date)}
              place={photo.location?.trim() || ""}
              camera={photo.camera?.trim() || ""}
            />

            <div className="grid grid-cols-2 gap-3">
              <PhotoAdjacentNavCard
                href={olderHref}
                direction="older"
                photo={olderPhoto}
                ariaLabel="前の写真（より古い）"
              />
              <PhotoAdjacentNavCard
                href={newerHref}
                direction="newer"
                photo={newerPhoto}
                ariaLabel="次の写真（より新しい）"
              />
            </div>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
