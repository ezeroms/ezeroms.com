import { revalidatePath } from "next/cache";

export function revalidateGiantsPaths(slug?: string) {
  revalidatePath("/shoulders-of-giants");
  if (slug) {
    revalidatePath(`/shoulders-of-giants/${slug}`);
  }
}
