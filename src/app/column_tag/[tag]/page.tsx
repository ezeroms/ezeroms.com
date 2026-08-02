import { redirect } from "next/navigation";
import {
  emptyColumnFilter,
  serializeColumnFilter,
} from "@/lib/content/column-filter";

export const revalidate = 60;

/** Legacy tag URLs → query filter on /column/ */
export default async function ColumnTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  redirect(
    `/column/${serializeColumnFilter({
      ...emptyColumnFilter(),
      tags: [decoded],
    })}`,
  );
}
