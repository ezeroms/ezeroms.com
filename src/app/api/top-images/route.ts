import { listTopImages } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

/** List published top images (for admin preview / debugging). */
export async function GET() {
  try {
    const items = await listTopImages();
    return jsonOk({ items, total: items.length });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to list top images",
    );
  }
}
