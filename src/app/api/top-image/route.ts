import { getRandomTopImageUrl } from "@/lib/content/queries";
import { jsonError, jsonNoStore } from "@/lib/api";

/** Returns one published top image at random (no-store). */
export async function GET() {
  try {
    const image = await getRandomTopImageUrl();
    if (!image) {
      return jsonError("No top images", 404);
    }
    return jsonNoStore(image);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to get top image",
    );
  }
}
