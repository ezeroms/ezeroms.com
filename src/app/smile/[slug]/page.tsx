import { PhotoDetailPage } from "@/components/PhotoDetailPage";

export const revalidate = 60;

export default async function SmilePhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PhotoDetailPage galleryId="smile" slug={slug} />;
}
