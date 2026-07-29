import type { Metadata } from "next";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { SiteShell } from "@/components/SiteShell";
import { absoluteUrl } from "@/lib/content/absolute-url";
import { photoDetailHref } from "@/lib/content/photo-adjacent";
import { formatPhotoCaption } from "@/lib/content/photo-caption";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import {
  getPhotoBySlug,
  listPhotos,
  requirePublicPhotoGallery,
} from "@/lib/content/queries";

type Props = {
  galleryId: PhotoGalleryId;
};

export async function photoGalleryMetadata(
  galleryId: PhotoGalleryId,
): Promise<Metadata> {
  const gallery = await requirePublicPhotoGallery(galleryId);
  return sectionListingMetadata({
    title: gallery.label,
    description: gallery.description,
    ogImage: gallery.og_image,
  });
}

/**
 * 写真詳細の metadata。
 * OGP は当該写真の image_url を優先し、無ければギャラリー → サイト既定へフォールバック。
 */
export async function photoDetailMetadata(
  galleryId: PhotoGalleryId,
  slug: string,
): Promise<Metadata> {
  const gallery = await requirePublicPhotoGallery(galleryId);
  const photo = await getPhotoBySlug(galleryId, slug);
  if (!photo) {
    return { title: gallery.label };
  }

  const caption = formatPhotoCaption(photo);
  const title = caption || gallery.label;
  const description = gallery.description || undefined;
  const ogImage = resolveOgImageUrl(photo.image_url, gallery.og_image);
  const url = absoluteUrl(
    photoDetailHref(gallery.basePath, photo.slug),
    siteUrl(),
  );
  const images = ogImageMetadata(ogImage);

  return {
    title,
    description,
    alternates: { canonical: url },
    ...images,
    openGraph: {
      ...images.openGraph,
      title,
      description,
      url,
      type: "article",
    },
  };
}

export async function PhotoGalleryIndexPage({ galleryId }: Props) {
  const gallery = await requirePublicPhotoGallery(galleryId);
  const listed = await listPhotos(galleryId).catch(() => ({
    items: [],
    total: 0,
  }));

  return (
    <SiteShell
      bodyClassName={`is-${galleryId}`}
      contentClassName="p-4 min-[768px]:p-5 min-[1080px]:p-6"
      showTagsAside={false}
      breadcrumbSectionHref={gallery.basePath}
      breadcrumbInfo={gallery.description}
    >
      <PhotoGallery items={listed.items} galleryId={galleryId} />
    </SiteShell>
  );
}
