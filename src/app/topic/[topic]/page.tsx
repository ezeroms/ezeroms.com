import { redirect } from "next/navigation";
import { serializeGiantsFilter } from "@/lib/content/giants-filter";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const decoded = decodeURIComponent(topic);
  redirect(
    `/shoulders-of-giants/${serializeGiantsFilter({ topics: [decoded] })}`,
  );
}
