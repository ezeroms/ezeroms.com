import { getRandomTopImageUrl, TOP_IMAGE_AVOID_LIMIT } from "@/lib/content/queries";
import { jsonError, jsonNoStore } from "@/lib/api";

/** カンマ区切りの slug。直近に出した分だけを受け、未知の文字は捨てる。 */
function avoidSlugsFrom(request: Request): string[] {
  const raw = new URL(request.url).searchParams.get("avoid") ?? "";
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const slug = part.trim();
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(slug) || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= TOP_IMAGE_AVOID_LIMIT) break;
  }
  return slugs;
}

/** Returns one published top image at random (no-store). */
export async function GET(request: Request) {
  try {
    const image = await getRandomTopImageUrl(avoidSlugsFrom(request));
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
