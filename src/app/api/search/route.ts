import { searchContent } from "@/lib/content/queries";
import {
  getSearchScope,
  isSearchScopeId,
  type SearchScopeId,
} from "@/lib/content/search-scope";
import { jsonError, jsonNoStore } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const scopeParam = url.searchParams.get("scope") ?? "all";
    const scope: SearchScopeId = isSearchScopeId(scopeParam)
      ? scopeParam
      : "all";
    const data = await searchContent(q, scope);
    const meta = getSearchScope(scope);
    return jsonNoStore({ ...data, label: meta.label });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Search failed");
  }
}
