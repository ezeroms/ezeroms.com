import type { Metadata } from "next";
import { PhotoDetailPage } from "@/components/PhotoDetailPage";
import { photoDetailMetadata } from "@/components/PhotoGalleryIndexPage";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return photoDetailMetadata("tabekake", slug);
}

export default async function TabekakePhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PhotoDetailPage galleryId="tabekake" slug={slug} />;
}
