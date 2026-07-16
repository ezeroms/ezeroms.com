import { searchContent } from "@/lib/content/queries";
import { jsonError, jsonNoStore } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const data = await searchContent(q);
    return jsonNoStore({ query: q, ...data });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Search failed");
  }
}
