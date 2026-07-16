import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { getUidgBySlug } from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

export default async function UidgPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = await getUidgBySlug(slug);
  if (!item) notFound();

  return (
    <SiteShell
      bodyClassName="is-ui-design-guidebook"
      mainClassName="layout-main--with-header-toc"
      showTagsAside={false}
    >
      <article className="article-container">
        <h1>{item.title}</h1>
        {item.description ? <p>{item.description}</p> : null}
        <div
          className="article-item"
          dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body_html) }}
        />
      </article>
    </SiteShell>
  );
}
