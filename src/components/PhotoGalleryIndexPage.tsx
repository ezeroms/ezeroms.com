import type { Metadata } from "next";
import { MobileHeader } from "@/components/MobileHeader";
import { PhotoFilterPanel } from "@/components/PhotoFilterPanel";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { SiteShell } from "@/components/SiteShell";
import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";
import {
  parsePhotoFilter,
  photoFilterActive,
} from "@/lib/content/photo-filter";
import { listPhotos, listPhotoTaxonomy } from "@/lib/content/queries";
import { summarizePhotoFilter } from "@/lib/site/breadcrumb-filters";

type Props = {
  galleryId: PhotoGalleryId;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function photoGalleryMetadata(galleryId: PhotoGalleryId): Metadata {
  const gallery = getPhotoGallery(galleryId);
  return {
    title: gallery.label,
    description: gallery.description,
  };
}

export async function PhotoGalleryIndexPage({
  galleryId,
  searchParams,
}: Props) {
  const gallery = getPhotoGallery(galleryId);
  const resolvedSearchParams = await searchParams;
  const filter = parsePhotoFilter(resolvedSearchParams);
  const isFiltering = photoFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listPhotoTaxonomy(galleryId).catch(() => ({
      years: [] as string[],
      tags: [] as string[],
    })),
    listPhotos(
      galleryId,
      isFiltering ? { years: filter.years } : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName={`is-${galleryId}`}
      mobileHeader={<MobileHeader title={gallery.label} />}
      secondary={
        <PhotoFilterPanel
          years={taxonomy.years}
          initial={filter}
          basePath={gallery.basePath}
        />
      }
      showTagsAside
      breadcrumbFilter={isFiltering ? summarizePhotoFilter(filter) : null}
      breadcrumbSectionHref={gallery.basePath}
    >
      <PhotoGallery items={listed.items} />
    </SiteShell>
  );
}
