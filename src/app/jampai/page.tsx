import type { Metadata } from "next";
import {
  PhotoGalleryIndexPage,
  photoGalleryMetadata,
} from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return photoGalleryMetadata("jampai");
}

export default async function JampaiIndexPage() {
  return <PhotoGalleryIndexPage galleryId="jampai" />;
}
