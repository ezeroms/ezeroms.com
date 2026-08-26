import { revalidatePath } from "next/cache";

export function revalidateWorkPaths(
  slug: string,
  options?: { chooning?: boolean },
) {
  revalidatePath("/works/creative");
  revalidatePath(`/works/creative/${slug}/`);
  revalidatePath(`/work/${slug}/`);
  if (options?.chooning) {
    revalidatePath("/works/chooning");
  }
}
