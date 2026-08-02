import { listGiants } from "@/lib/content/queries";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const topic = new URL(request.url).searchParams.get("topic") ?? undefined;
    const data = await listGiants({ topic });
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list giants");
  }
}
