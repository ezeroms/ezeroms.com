import type { Metadata } from "next";
import {
  PhotoGalleryIndexPage,
  photoGalleryMetadata,
} from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return photoGalleryMetadata("tabekake");
}

export default async function TabekakeIndexPage() {
  return <PhotoGalleryIndexPage galleryId="tabekake" />;
}
