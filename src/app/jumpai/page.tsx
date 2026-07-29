import type { Metadata } from "next";
import {
  PhotoGalleryIndexPage,
  photoGalleryMetadata,
} from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return photoGalleryMetadata("jumpai");
}

export default async function JumpaiIndexPage() {
  return <PhotoGalleryIndexPage galleryId="jumpai" />;
}
