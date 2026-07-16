import { SiteShell } from "@/components/SiteShell";
import { SearchClient } from "@/components/SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <SiteShell showTagsAside={false}>
      <SearchClient />
    </SiteShell>
  );
}
