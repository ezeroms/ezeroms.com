import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { absoluteUrl } from "@/lib/content/absolute-url";
import {
  OG_IMAGE_ASPECT_CLASS,
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import { getWorkBySlug, listWork, requirePublicWorksSection } from "@/lib/content/queries";
import {
  formatWorkPeriod,
  serializeWorkFilter,
} from "@/lib/content/work-filter";
import { sanitizeBody } from "@/lib/html";
import { cn } from "@/lib/cn";
import { proseBodyClass } from "@/lib/site/prose-styles";

export const revalidate = 60;

export async function generateStaticParams() {
  const { items } = await listWork().catch(() => ({
    items: [] as Awaited<ReturnType<typeof listWork>>["items"],
  }));
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const section = await requirePublicWorksSection("creative").catch(() => null);
  if (!section) return { title: "Creative" };

  const { slug } = await params;
  const item = await getWorkBySlug(slug);
  if (!item) return { title: section.label };

  const title = item.title;
  const url = absoluteUrl(`/works/creative/${slug}/`, siteUrl());
  const ogImage = resolveOgImageUrl(item.og_image, item.image_url);
  const images = ogImageMetadata(ogImage);

  return {
    title,
    alternates: { canonical: url },
    openGraph: {
      ...images.openGraph,
      title,
      url,
      type: "article",
    },
    twitter: {
      ...images.twitter,
      title,
    },
  };
}

export default async function CreativeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePublicWorksSection("creative");
  const { slug } = await params;
  const item = await getWorkBySlug(slug);
  if (!item) notFound();

  const period = formatWorkPeriod(item.start_date, item.end_date);

  return (
    <SiteShell
      bodyClassName="is-works-creative"
      mobileHeader={<MobileHeader title="Creative" />}
      breadcrumbCurrent={item.title}
    >
      <article className="mx-auto max-w-3xl font-sans text-foreground">
        {(item.image_url || item.og_image) ? (
          <div
            className={cn(
              "mb-6 overflow-hidden rounded-xl bg-muted",
              OG_IMAGE_ASPECT_CLASS,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(item.image_url || item.og_image)!}
              alt=""
              className="m-0 block h-full w-full object-cover"
            />
          </div>
        ) : null}

        <h1 className="m-0 text-2xl font-semibold tracking-tight">{item.title}</h1>

        <dl className="mt-4 grid gap-2 text-sm text-muted-foreground">
          {period ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">期間</dt>
              <dd className="m-0">{period}</dd>
            </div>
          ) : null}
          {item.client ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">Client</dt>
              <dd className="m-0">{item.client}</dd>
            </div>
          ) : null}
          {item.role ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">Role</dt>
              <dd className="m-0">{item.role}</dd>
            </div>
          ) : null}
          {item.agency ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">Agency</dt>
              <dd className="m-0">{item.agency}</dd>
            </div>
          ) : null}
        </dl>

        {(item.work_tag ?? []).length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {(item.work_tag ?? []).map((t) => (
              <Link
                key={t}
                href={`/works/creative/${serializeWorkFilter({
                  years: [],
                  categories: [],
                  tags: [t],
                  clients: [],
                  kinds: [],
                })}`}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground no-underline hover:text-foreground"
              >
                {t}
              </Link>
            ))}
          </div>
        ) : null}

        {item.body_html?.trim() ? (
          <div
            className={cn(
              "mt-6 max-w-none text-base leading-relaxed text-foreground",
              proseBodyClass,
            )}
            dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body_html) }}
          />
        ) : null}
      </article>
    </SiteShell>
  );
}
