import { redirect } from "next/navigation";
import { AboutShell } from "@/components/AboutToc";
import { getAboutBySlug, listAbout } from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/** Public URL slug → content slug in DB / Hugo */
const CONTENT_BY_PUBLIC: Record<string, string> = {
  me: "profile",
  here: "site",
  contact: "contact",
  profile: "profile",
  site: "site",
};

const PUBLIC_SLUGS = ["me", "here", "contact"] as const;

export async function generateStaticParams() {
  const pages = await listAbout().catch(() => []);
  const fromDb = pages
    .map((p) => {
      if (p.slug === "profile") return { slug: "me" };
      if (p.slug === "site") return { slug: "here" };
      if (p.slug === "contact") return { slug: "contact" };
      return null;
    })
    .filter(Boolean) as { slug: string }[];
  if (fromDb.length) return fromDb;
  return PUBLIC_SLUGS.map((slug) => ({ slug }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "profile") redirect("/about/me/");
  if (slug === "site") redirect("/about/here/");

  const contentSlug = CONTENT_BY_PUBLIC[slug];
  if (!contentSlug) {
    redirect("/about/me/");
  }

  const page = await getAboutBySlug(contentSlug);
  const pathname = `/about/${slug}/`;
  const showCover = slug === "me";

  return (
    <AboutShell pathname={pathname}>
      {page ? (
        <article>
          {showCover ? (
            <div className="mb-6 overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/about/profile.webp"
                alt=""
                className="m-0 block h-auto w-full object-cover"
              />
            </div>
          ) : null}
          <div
            className="prose prose-sm max-w-none text-foreground prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-foreground prose-a:underline-offset-2"
            dangerouslySetInnerHTML={{ __html: sanitizeBody(page.body_html) }}
          />
        </article>
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          コンテンツが見つかりませんでした。
        </p>
      )}
    </AboutShell>
  );
}
