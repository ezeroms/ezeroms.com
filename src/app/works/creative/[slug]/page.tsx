import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { getWorkBySlug } from "@/lib/content/queries";
import {
  formatWorkPeriod,
  serializeWorkFilter,
} from "@/lib/content/work-filter";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

export default async function CreativeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getWorkBySlug(slug);
  if (!item) notFound();

  const period = formatWorkPeriod(item.start_date, item.end_date);

  return (
    <SiteShell
      bodyClassName="is-works-creative"
      mobileHeader={<MobileHeader title="Creative" />}
      hidePageHeader
    >
      <article className="mx-auto max-w-3xl font-sans text-foreground">
        <p className="m-0 mb-4 text-sm text-muted-foreground">
          <Link
            href="/works/creative/"
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            ← Creative
          </Link>
        </p>

        {item.image_url ? (
          <div className="mb-6 overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt=""
              className="m-0 block h-auto w-full object-cover"
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
          <div className="mt-4 flex flex-wrap gap-1.5">
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
                className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground no-underline hover:text-foreground"
              >
                {t}
              </Link>
            ))}
          </div>
        ) : null}

        {item.body_html?.trim() ? (
          <div
            className="prose prose-sm mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body_html) }}
          />
        ) : null}
      </article>
    </SiteShell>
  );
}
