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
  return photoDetailMetadata("smile", slug);
}

export default async function SmilePhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PhotoDetailPage galleryId="smile" slug={slug} />;
}
