import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { WorkList } from "@/components/WorkList";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { listWork, requirePublicWorksSection } from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicWorksSection("chooning").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "Chooning",
    description:
      "音楽への思いを記録するプロダクト Chooning。特筆して残したい作品です。",
    ogImage: section?.og_image,
  });
}

export default async function ChooningPage() {
  const section = await requirePublicWorksSection("chooning");
  const { items } = await listWork({ productKey: "chooning" }).catch(() => ({
    items: [],
    total: 0,
  }));

  return (
    <SiteShell
      bodyClassName="is-works-chooning"
      showTagsAside={false}
    >
      <div className="mx-auto max-w-3xl font-sans text-foreground">
        <p className="m-0 text-sm text-muted-foreground">
          <a
            href="https://hello.chooning.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            hello.chooning.app ↗
          </a>
        </p>

        {items.length ? (
          <div className="mt-10">
            <h2 className="m-0 mb-4 text-lg font-semibold tracking-tight">
              Related
            </h2>
            <WorkList
              items={items}
              fallbackThumbSrc={section.og_image || null}
            />
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">
            関連エントリはこれから追加されます。制作実績は{" "}
            <Link
              href="/works/creative/"
              className="underline-offset-2 hover:underline"
            >
              Creative
            </Link>{" "}
            もご覧ください。
          </p>
        )}
      </div>
    </SiteShell>
  );
}
