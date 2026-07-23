import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { formatPhotoCaption } from "@/lib/content/photo-caption";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { formatPhotoDate } from "@/lib/content/photo-filter";
import { getPhotoBySlug, requirePublicPhotoGallery } from "@/lib/content/queries";

type Props = {
  galleryId: PhotoGalleryId;
  slug: string;
};

/**
 * 直接 URL 用の写真詳細。
 * タイトル・メモ（body_html）は公開 UI には出さない。
 * パンくず末尾には日付・場所を使う。
 */
export async function PhotoDetailPage({ galleryId, slug }: Props) {
  const gallery = await requirePublicPhotoGallery(galleryId);
  const photo = await getPhotoBySlug(galleryId, slug);
  if (!photo) notFound();

  const caption = formatPhotoCaption(photo);
  const imageAlt = caption || gallery.label;

  return (
    <SiteShell
      bodyClassName={`is-${galleryId}`}
      mobileHeader={<MobileHeader title={gallery.label} />}
      breadcrumbCurrent={caption || undefined}
      contentClassName="p-6"
    >
      <article className="mx-auto max-w-3xl font-sans text-foreground">
        {photo.image_url ? (
          <div className="mb-4 overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.image_url}
              alt={imageAlt}
              className="m-0 block h-auto w-full object-contain"
            />
          </div>
        ) : null}

        <dl className="mt-2 grid gap-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-foreground">撮影日</dt>
            <dd className="m-0">{formatPhotoDate(photo.date)}</dd>
          </div>
          {photo.location ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">撮影場所</dt>
              <dd className="m-0">{photo.location}</dd>
            </div>
          ) : null}
          {photo.camera ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">カメラ</dt>
              <dd className="m-0">{photo.camera}</dd>
            </div>
          ) : null}
        </dl>
      </article>
    </SiteShell>
  );
}
