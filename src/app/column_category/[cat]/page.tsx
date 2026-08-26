import { redirect } from "next/navigation";

export const revalidate = 60;

/** Legacy category URLs → Column 一覧（ジャンルは公開面から外した） */
export default async function ColumnCategoryPage() {
  redirect("/column/");
}
