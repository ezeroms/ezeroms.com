import type { Metadata } from "next";
import { ChronicleFilterPanel } from "@/components/ChronicleFilterPanel";
import { ChronicleTimeline } from "@/components/ChronicleTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  CHRONICLE_INTERESTS,
  chronicleFilterActive,
  parseChronicleFilter,
  serializeChronicleFilter,
} from "@/lib/content/chronicle-filter";
import {
  listChronicle,
  listChronicleTaxonomy,
} from "@/lib/content/queries";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Chronicle",
  description:
    "関心ごとの年表。社会・技術・自分の関心を、年とタグで横断して辿ります。",
};

export default async function ChroniclePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = parseChronicleFilter(sp);
  const filtering = chronicleFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listChronicleTaxonomy().catch(() => ({
      years: [] as string[],
      tags: [] as string[],
      categories: [] as string[],
    })),
    listChronicle(
      filtering
        ? {
            years: filter.years,
            tags: filter.tags,
            interests: filter.interests,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-chronicle"
      mobileHeader={<MobileHeader title="Chronicle" />}
      secondary={
        <ChronicleFilterPanel
          years={taxonomy.years}
          tags={taxonomy.tags}
          initial={filter}
          basePath="/chronicle/"
        />
      }
      showTagsAside
    >
      <div className="mb-6">
        <p className="m-0 mb-3 text-sm text-muted-foreground">
          関心を維持し、深めるための年表。社会・技術・自分の関心を軸に、年とタグで横断して探索できます。
        </p>
        <div className="flex flex-wrap gap-2">
          {CHRONICLE_INTERESTS.map((interest) => {
            const active = filter.interests.includes(interest.id);
            const next = {
              ...filter,
              interests: active
                ? filter.interests.filter((i) => i !== interest.id)
                : [...filter.interests, interest.id],
            };
            return (
              <Link
                key={interest.id}
                href={`/chronicle/${serializeChronicleFilter(next)}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] no-underline transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {interest.label}
              </Link>
            );
          })}
        </div>
      </div>

      <ChronicleTimeline items={listed.items} />
    </SiteShell>
  );
}
