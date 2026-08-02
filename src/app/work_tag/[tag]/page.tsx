import { redirect } from "next/navigation";
import {
  emptyWorkFilter,
  serializeWorkFilter,
} from "@/lib/content/work-filter";

export const revalidate = 60;

/** Legacy tag URLs → Creative filter */
export default async function WorkTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  redirect(
    `/works/creative/${serializeWorkFilter({
      ...emptyWorkFilter(),
      tags: [decoded],
    })}`,
  );
}
