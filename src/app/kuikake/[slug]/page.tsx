import { PhotoDetailPage } from "@/components/PhotoDetailPage";

export const revalidate = 60;

export default async function KuikakePhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PhotoDetailPage galleryId="kuikake" slug={slug} />;
}
