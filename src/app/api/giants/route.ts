import { listGiants } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const tag =
      params.get("tag") ?? params.get("topic") ?? undefined;
    const data = await listGiants({ tag });
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list giants");
  }
}
