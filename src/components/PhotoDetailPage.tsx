import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";
import { formatPhotoDate } from "@/lib/content/photo-filter";
import { getPhotoBySlug } from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

type Props = {
  galleryId: PhotoGalleryId;
  slug: string;
};

export async function PhotoDetailPage({ galleryId, slug }: Props) {
  const g = getPhotoGallery(galleryId);
  const item = await getPhotoBySlug(galleryId, slug);
  if (!item) notFound();

  return (
    <SiteShell
      bodyClassName={`is-${galleryId}`}
      mobileHeader={<MobileHeader title={g.label} />}
    >
      <article className="mx-auto max-w-3xl font-sans text-foreground">
        <p className="m-0 mb-4 text-sm text-muted-foreground">
          <Link
            href={g.basePath}
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ← {g.label}
          </Link>
        </p>

        {item.image_url ? (
          <div className="mb-6 overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.title}
              className="m-0 block h-auto w-full object-contain"
            />
          </div>
        ) : null}

        <h1 className="m-0 text-2xl font-semibold tracking-tight">{item.title}</h1>

        <dl className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-foreground">日付</dt>
            <dd className="m-0">{formatPhotoDate(item.date)}</dd>
          </div>
          {item.location ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">場所</dt>
              <dd className="m-0">{item.location}</dd>
            </div>
          ) : null}
          {item.camera ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">カメラ</dt>
              <dd className="m-0">{item.camera}</dd>
            </div>
          ) : null}
        </dl>

        {item.body_html?.trim() ? (
          <div
            className="prose prose-sm mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body_html) }}
          />
        ) : null}
      </article>
    </SiteShell>
  );
}
