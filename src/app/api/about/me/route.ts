import { getMeProfile } from "@/lib/content/queries";
import { jsonError, jsonNoStore } from "@/lib/api";

/** Public Me profile payload (structured tables). */
export async function GET() {
  try {
    const me = await getMeProfile();
    if (!me) {
      return jsonError("Me profile not found", 404);
    }
    return jsonNoStore(me);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to load Me profile",
    );
  }
}
