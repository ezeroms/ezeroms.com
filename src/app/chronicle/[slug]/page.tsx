import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { serializeChronicleFilter, formatChronicleWhen } from "@/lib/content/chronicle-filter";
import {
  getChronicleBySlug,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import { cn } from "@/lib/cn";
import { proseBodyClass } from "@/lib/site/prose-styles";

export const revalidate = 60;

export default async function ChronicleEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePublicLibrarySection("chronicle");
  const { slug } = await params;
  const item = await getChronicleBySlug(slug);
  if (!item) notFound();
  const meta = [item.category, item.subcategory].filter(Boolean).join(" · ");

  return (
    <SiteShell
      bodyClassName="is-chronicle"
      mobileHeader={<MobileHeader title="Chronicle" />}
    >
      <article className="mx-auto max-w-3xl font-sans text-foreground">
        <p className="m-0 mb-4 text-sm text-muted-foreground">
          <Link
            href="/chronicle/"
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ← Chronicle
          </Link>
        </p>

        <p className="m-0 mb-2 text-sm text-muted-foreground">
          <time dateTime={item.date}>{formatChronicleWhen(item)}</time>
          {meta ? ` · ${meta}` : ""}
        </p>

        <h1 className="m-0 text-2xl font-semibold tracking-tight">
          {item.title}
        </h1>

        {item.description ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        ) : null}

        {(item.chronicle_tag ?? []).length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {(item.chronicle_tag ?? []).map((t) => (
              <Link
                key={t}
                href={`/chronicle/${serializeChronicleFilter({
                  interests: [],
                  years: [],
                  tags: [t],
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
