import { AdminPhotoEditPage } from "@/components/admin/AdminPhotoEditPage";

export const dynamic = "force-dynamic";

export default async function AdminSmileEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminPhotoEditPage galleryId="smile" slug={slug} />;
}
