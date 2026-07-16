import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { MobileHeader } from "@/components/MobileHeader";
import { getColumnBySlug } from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

export default async function ColumnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getColumnBySlug(slug);
  if (!item) notFound();

  return (
    <SiteShell
      bodyClassName="is-column"
      mobileHeader={<MobileHeader title={item.title} />}
      showTagsAside={false}
      showLayoutHeader={false}
    >
      <section className="page-section">
        <div className="page-section__content">
          <article className="article-container article-item">
            <p className="date">
              {new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h1>{item.title}</h1>
            <div className="article-header__tags">
              {[...(item.column_tag ?? [])].sort().map((tag) => (
                <Link
                  key={tag}
                  href={`/column_tag/${encodeURIComponent(tag)}/`}
                  className="tag"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body_html) }}
            />
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
