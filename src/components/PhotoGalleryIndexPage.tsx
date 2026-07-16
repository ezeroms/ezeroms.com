import type { Metadata } from "next";
import { MobileHeader } from "@/components/MobileHeader";
import { PhotoFilterPanel } from "@/components/PhotoFilterPanel";
import { PhotoMasonry } from "@/components/PhotoMasonry";
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

type Props = {
  galleryId: PhotoGalleryId;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function photoGalleryMetadata(galleryId: PhotoGalleryId): Metadata {
  const g = getPhotoGallery(galleryId);
  return {
    title: g.label,
    description: g.description,
  };
}

export async function PhotoGalleryIndexPage({
  galleryId,
  searchParams,
}: Props) {
  const g = getPhotoGallery(galleryId);
  const sp = await searchParams;
  const filter = parsePhotoFilter(sp);
  const filtering = photoFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listPhotoTaxonomy(galleryId).catch(() => ({
      years: [] as string[],
      tags: [] as string[],
    })),
    listPhotos(
      galleryId,
      filtering ? { years: filter.years } : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName={`is-${galleryId}`}
      mobileHeader={<MobileHeader title={g.label} />}
      secondary={
        <PhotoFilterPanel
          years={taxonomy.years}
          initial={filter}
          basePath={g.basePath}
        />
      }
      showTagsAside
    >
      <div className="w-full py-0 font-sans text-foreground">
        <PhotoMasonry items={listed.items} basePath={g.basePath} />
      </div>
    </SiteShell>
  );
}
