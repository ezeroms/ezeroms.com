import { redirect } from "next/navigation";
import { serializeColumnFilter } from "@/lib/content/column-filter";

export const revalidate = 60;

/** Legacy category URLs → query filter on /column/ */
export default async function ColumnCategoryPage({
  params,
}: {
  params: Promise<{ cat: string }>;
}) {
  const { cat } = await params;
  const category = decodeURIComponent(cat);
  redirect(
    `/column/${serializeColumnFilter({
      months: [],
      weekdays: [],
      categories: [category],
      tags: [],
    })}`,
  );
}
