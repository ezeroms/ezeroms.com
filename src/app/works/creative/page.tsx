import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { WorkFilterPanel } from "@/components/WorkFilterPanel";
import { WorkList } from "@/components/WorkList";
import {
  parseWorkFilter,
  workFilterActive,
} from "@/lib/content/work-filter";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { summarizeWorkFilter } from "@/lib/site/breadcrumb-filters";
import {
  listWork,
  listWorkTaxonomy,
  requirePublicWorksSection,
} from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicWorksSection("creative").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "Creative",
    description:
      "つくったもの・サイトのギャラリー。制作実績を並べて眺める場所です。",
    ogImage: section?.og_image,
  });
}

export default async function CreativePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicWorksSection("creative");
  const resolvedSearchParams = await searchParams;
  const filter = parseWorkFilter(resolvedSearchParams);
  const filtering = workFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listWorkTaxonomy().catch(() => ({
      years: [] as string[],
      categories: [] as string[],
      tags: [] as string[],
      clients: [] as string[],
    })),
    listWork({
      excludeKinds: ["involvement"],
      ...(filtering
        ? {
            from: filter.from,
            to: filter.to,
            categories: filter.categories,
            tags: filter.tags,
            clients: filter.clients,
            kinds: filter.kinds,
          }
        : {}),
    }).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-works-creative"
      secondary={
        <WorkFilterPanel
          categories={taxonomy.categories}
          tags={taxonomy.tags}
          clients={taxonomy.clients}
          initial={filter}
          basePath="/works/creative/"
          showKinds
        />
      }
      showTagsAside
      breadcrumbFilter={filtering ? summarizeWorkFilter(filter) : null}
      breadcrumbSectionHref="/works/creative/"
    >
      <WorkList
        items={listed.items}
        fallbackThumbSrc={section.og_image || null}
      />
    </SiteShell>
  );
}
