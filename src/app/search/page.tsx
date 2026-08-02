import { redirect } from "next/navigation";
import { firstSearchParamValue } from "@/lib/content/filter-search-params";
import {
  buildSearchHref,
  isSearchScopeId,
} from "@/lib/content/search-scope";
import { renderSearchPage } from "@/lib/site/render-search-page";

export const dynamic = "force-dynamic";

/**
 * サイト全体検索。旧 `?scope=` 付き URL は各セクションの `/…/search/` へリダイレクト。
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const initialQuery = firstSearchParamValue(resolved, "q").trim();
  const scopeParam = firstSearchParamValue(resolved, "scope").trim();

  if (isSearchScopeId(scopeParam) && scopeParam !== "all") {
    redirect(buildSearchHref(scopeParam, initialQuery));
  }

  return renderSearchPage("all", searchParams);
}
