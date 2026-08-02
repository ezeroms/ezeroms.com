import { listDiary } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ?? undefined;
    const tag = searchParams.get("tag") ?? undefined;
    const place = searchParams.get("place") ?? undefined;
    const limit = searchParams.get("limit");
    const data = await listDiary({
      month,
      tag,
      place,
      limit: limit ? Number(limit) : undefined,
    });
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list diary");
  }
}
