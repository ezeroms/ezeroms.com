import { redirect } from "next/navigation";
import { serializeWorkFilter } from "@/lib/content/work-filter";

export const revalidate = 60;

/** Legacy category URLs → Creative filter */
export default async function WorkCategoryPage({
  params,
}: {
  params: Promise<{ cat: string }>;
}) {
  const { cat } = await params;
  const category = decodeURIComponent(cat);
  redirect(
    `/works/creative/${serializeWorkFilter({
      years: [],
      categories: [category],
      tags: [],
      clients: [],
      kinds: [],
    })}`,
  );
}
