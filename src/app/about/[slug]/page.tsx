import { redirect } from "next/navigation";
import { AboutArticle } from "@/components/AboutArticle";
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

/** カード見出しと重複する先頭の h1 を本文から外す（Column 詳細と同じ構成） */
function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "");
}

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
  const isMe = slug === "me";

  // Me は本文先頭の名前見出しを活かす。Here / Contact は front matter の title をカード見出しに使う
  const cardTitle = isMe ? undefined : page?.title;
  const bodyHtml = page
    ? sanitizeBody(
        cardTitle ? stripLeadingH1(page.body_html) : page.body_html,
      )
    : "";

  return (
    <AboutShell pathname={pathname}>
      {page ? (
        <AboutArticle
          bodyHtml={bodyHtml}
          title={cardTitle}
          coverSrc={isMe ? "/images/about/profile.webp" : null}
        />
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          コンテンツが見つかりませんでした。
        </p>
      )}
    </AboutShell>
  );
}
