import { SiteShell } from "@/components/SiteShell";
import { SearchClient } from "@/components/SearchClient";
import { firstSearchParamValue } from "@/lib/content/filter-search-params";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const initialQuery = firstSearchParamValue(resolved, "q").trim();

  return (
    <SiteShell
      showTagsAside={false}
      hideHeaderSearch
      breadcrumbCurrent={initialQuery || undefined}
    >
      <SearchClient initialQuery={initialQuery} />
    </SiteShell>
  );
}
