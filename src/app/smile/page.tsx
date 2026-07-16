import type { Metadata } from "next";
import {
  PhotoGalleryIndexPage,
  photoGalleryMetadata,
} from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export const metadata: Metadata = photoGalleryMetadata("smile");

export default async function SmileIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <PhotoGalleryIndexPage galleryId="smile" searchParams={searchParams} />
  );
}
