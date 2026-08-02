import { listColumn, getColumnBySlug } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await listColumn({
      category: searchParams.get("category") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    });
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list column");
  }
}
