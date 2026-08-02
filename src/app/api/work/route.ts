import { listWork } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await listWork({
      category: searchParams.get("category") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
    });
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list work");
  }
}
