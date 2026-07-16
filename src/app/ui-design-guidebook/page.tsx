import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { listUidg } from "@/lib/content/queries";

export const revalidate = 60;

export default async function UidgIndexPage() {
  const items = await listUidg();
  const bySection = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.section] ??= []).push(item);
    return acc;
  }, {});

  return (
    <SiteShell
      bodyClassName="is-ui-design-guidebook"
      mainClassName="layout-main--with-header-toc"
      showTagsAside={false}
    >
      <h1>UI Design Guidebook</h1>
      {Object.entries(bySection).map(([section, list]) => (
        <section key={section}>
          <h2>{section}</h2>
          <ul>
            {list.map((item) => (
              <li key={item.id}>
                <Link href={`/ui-design-guidebook/${section}/${item.slug}/`}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </SiteShell>
  );
}
