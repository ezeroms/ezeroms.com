import { redirect } from "next/navigation";

export default async function LegacyWorkDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/works/creative/${slug}/`);
}
