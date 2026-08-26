import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AboutArticle, AboutHereArticles } from "@/components/AboutArticle";
import { AboutMeProfile } from "@/components/AboutMeProfile";
import { AboutShell } from "@/components/AboutShell";
import { absoluteUrl } from "@/lib/content/absolute-url";
import {
  ABOUT_PUBLIC_SLUGS,
  aboutContentSlugFromPublic,
  aboutPublicSlugFromContent,
  isAboutPublicSlug,
  redirectPathForLegacyAboutSlug,
} from "@/lib/content/about-routes";
import { hereCardsFromFields } from "@/lib/content/about-here";
import { htmlToPlainText } from "@/lib/content/html-plain";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getAboutBySlug,
  getMeProfile,
  listAbout,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/**
 * カード見出しと重複する先頭の h1 を本文から外す。
 * Column 詳細と同様、タイトルはページ側で出すため。
 */
function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "");
}

function excerptFromHtml(html: string, maxLen = 160): string {
  const text = htmlToPlainText(html).replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: requestedSlug } = await params;
  if (!isAboutPublicSlug(requestedSlug)) {
    return { title: "About" };
  }

  const contentSlug = aboutContentSlugFromPublic(requestedSlug);
  if (!contentSlug) return { title: "About" };

  // Me は構造化プロフィールの OGP を優先する
  if (requestedSlug === "me") {
    const meProfile = await getMeProfile();
    if (meProfile) {
      const title = meProfile.profile.name || "Me";
      const description = meProfile.profile.bio_html
        ? excerptFromHtml(meProfile.profile.bio_html) || undefined
        : undefined;
      const ogImage = resolveOgImageUrl(meProfile.profile.og_image);
      const url = absoluteUrl("/about/me/", siteUrl());
      const images = ogImageMetadata(ogImage);
      return {
        title,
        description,
        alternates: { canonical: url },
        ...images,
        openGraph: {
          ...images.openGraph,
          title,
          description,
          url,
          type: "website",
        },
      };
    }
  }

  const page = await getAboutBySlug(contentSlug);
  const title = page?.title?.trim() || requestedSlug;
  const description = page?.body_html
    ? excerptFromHtml(page.body_html) || undefined
    : undefined;
  const ogImage = resolveOgImageUrl(page?.og_image);
  const url = absoluteUrl(`/about/${requestedSlug}/`, siteUrl());
  const images = ogImageMetadata(ogImage);

  return {
    title,
    description,
    alternates: { canonical: url },
    ...images,
    openGraph: {
      ...images.openGraph,
      title,
      description,
      url,
      type: "website",
    },
  };
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

  const isMePage = requestedSlug === "me";

  // Me は構造化プロフィール（about_profile など）を優先
  if (isMePage) {
    const meProfile = await getMeProfile();
    if (meProfile) {
      return (
        <AboutShell>
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

  // Contact は title をページ見出しに使う。Here の title は OGP 用。
  const cardTitle = isMePage || requestedSlug === "here" ? undefined : page?.title;
  const rawBodyHtml = page?.body_html ?? "";
  const bodyForCard = cardTitle ? stripLeadingH1(rawBodyHtml) : rawBodyHtml;
  const bodyHtml = page ? sanitizeBody(bodyForCard) : "";
  const hereCards = page
    ? hereCardsFromFields(page).map((card) => ({
        ...card,
        html: sanitizeBody(card.html),
      }))
    : [];

  return (
    <AboutShell>
      {page ? (
        requestedSlug === "here" ? (
          <AboutHereArticles cards={hereCards} pageTitle={page.title} />
        ) : (
          <AboutArticle
            bodyHtml={bodyHtml}
            title={cardTitle}
            coverSrc={isMePage ? "/images/about/profile.webp" : null}
          />
        )
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          コンテンツが見つかりませんでした。
        </p>
      )}
    </AboutShell>
  );
}
