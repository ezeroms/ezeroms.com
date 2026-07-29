import { SiteShell } from "@/components/SiteShell";
import { SearchClient } from "@/components/SearchClient";
import { firstSearchParamValue } from "@/lib/content/filter-search-params";
import type { SearchScopeId } from "@/lib/content/search-scope";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * セクション配下 `/…/search/` とサイト全体 `/search/` で共有する検索ページ。
 */
export async function renderSearchPage(
  scope: SearchScopeId,
  searchParams: SearchParams,
) {
  const resolved = await searchParams;
  const initialQuery = firstSearchParamValue(resolved, "q").trim();

  return (
    <SiteShell
      showTagsAside={false}
      hideHeaderSearch
      breadcrumbCurrent={initialQuery || undefined}
    >
      <SearchClient initialQuery={initialQuery} initialScope={scope} />
    </SiteShell>
  );
}
