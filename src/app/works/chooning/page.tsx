import type { Metadata } from "next";
import Link from "next/link";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { WorkList } from "@/components/WorkList";
import { listWork } from "@/lib/content/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Chooning",
  description:
    "音楽への思いを記録するプロダクト Chooning。特筆して残したい作品です。",
};

export default async function ChooningPage() {
  const { items } = await listWork({ productKey: "chooning" }).catch(() => ({
    items: [],
    total: 0,
  }));

  return (
    <SiteShell
      bodyClassName="is-works-chooning"
      mobileHeader={<MobileHeader title="Chooning" />}
      showTagsAside={false}
    >
      <div className="mx-auto max-w-3xl font-sans text-foreground">
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          音楽への思いを記録するプロダクト。Works のなかでも特に力を入れている取り組みです。
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
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
            <WorkList items={items} />
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
