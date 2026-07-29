import type { Metadata } from "next";
import {
  PhotoGalleryIndexPage,
  photoGalleryMetadata,
} from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return photoGalleryMetadata("smile");
}

export default async function SmileIndexPage() {
  return <PhotoGalleryIndexPage galleryId="smile" />;
}
