import { getDiaryBySlug } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const item = await getDiaryBySlug(slug);
    if (!item) return jsonError("Not found", 404);
    return jsonOk(item);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to get diary");
  }
}
