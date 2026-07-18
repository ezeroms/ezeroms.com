import type { Metadata } from "next";
import {
  PhotoGalleryIndexPage,
  photoGalleryMetadata,
} from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return photoGalleryMetadata("jumpai");
}

export default async function JumpaiIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <PhotoGalleryIndexPage galleryId="jumpai" searchParams={searchParams} />
  );
}
