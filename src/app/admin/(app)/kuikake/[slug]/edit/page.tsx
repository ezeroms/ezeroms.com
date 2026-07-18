import { AdminPhotoEditPage } from "@/components/admin/AdminPhotoEditPage";

export const dynamic = "force-dynamic";

export default async function AdminKuikakeEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminPhotoEditPage galleryId="kuikake" slug={slug} />;
}
