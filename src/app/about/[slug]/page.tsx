import { redirect } from "next/navigation";
import { AboutArticle } from "@/components/AboutArticle";
import { AboutMeProfile } from "@/components/AboutMeProfile";
import { AboutShell } from "@/components/AboutShell";
import {
  ABOUT_PUBLIC_SLUGS,
  aboutContentSlugFromPublic,
  aboutPublicSlugFromContent,
  isAboutPublicSlug,
  redirectPathForLegacyAboutSlug,
} from "@/lib/content/about-routes";
import {
  getAboutBySlug,
  getMeProfile,
  listAbout,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/**
 * カード見出しと重複する先頭の h1 を本文から外す。
 * Column 詳細と同様、タイトルはカード側で出すため。
 */
function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "");
}

export async function generateStaticParams() {
  const pages = await listAbout().catch(() => []);
  const fromDatabase = pages
    .map((page) => {
      const publicSlug = aboutPublicSlugFromContent(page.slug);
      return publicSlug ? { slug: publicSlug } : null;
    })
    .filter(Boolean) as { slug: string }[];

  if (fromDatabase.length) return fromDatabase;
  return ABOUT_PUBLIC_SLUGS.map((slug) => ({ slug }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: requestedSlug } = await params;

  // 旧 Hugo パス（/about/site/ など）は正式な公開 URL へ寄せる
  const legacyRedirect = redirectPathForLegacyAboutSlug(requestedSlug);
  if (legacyRedirect) {
    redirect(legacyRedirect);
  }

  if (!isAboutPublicSlug(requestedSlug)) {
    redirect("/about/me/");
  }

  const pathname = `/about/${requestedSlug}/`;
  const isMePage = requestedSlug === "me";

  // Me は構造化プロフィール（about_profile など）を優先
  if (isMePage) {
    const meProfile = await getMeProfile();
    if (meProfile) {
      return (
        <AboutShell pathname={pathname}>
          <AboutMeProfile
            data={{
              ...meProfile,
              profile: {
                ...meProfile.profile,
                bio_html: sanitizeBody(meProfile.profile.bio_html),
              },
              based_in: meProfile.based_in.map((row) => ({
                ...row,
                body_html: sanitizeBody(row.body_html),
              })),
            }}
          />
        </AboutShell>
      );
    }
  }

  const contentSlug = aboutContentSlugFromPublic(requestedSlug);
  if (!contentSlug) {
    redirect("/about/me/");
  }

  const page = await getAboutBySlug(contentSlug);

  // Me は本文内の名前見出しを使う。Here / Contact は front matter / DB の title をカード見出しに使う
  const cardTitle = isMePage ? undefined : page?.title;
  const rawBodyHtml = page?.body_html ?? "";
  const bodyForCard = cardTitle ? stripLeadingH1(rawBodyHtml) : rawBodyHtml;
  const bodyHtml = page ? sanitizeBody(bodyForCard) : "";

  return (
    <AboutShell pathname={pathname}>
      {page ? (
        <AboutArticle
          bodyHtml={bodyHtml}
          title={cardTitle}
          coverSrc={isMePage ? "/images/about/profile.webp" : null}
        />
          ) : (
        <p className="m-0 text-sm text-muted-foreground">
          コンテンツが見つかりませんでした。
        </p>
      )}
    </AboutShell>
  );
}
