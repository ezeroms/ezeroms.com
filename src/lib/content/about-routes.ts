/**
 * About セクションの公開 URL と、DB / Markdown 上の識別子の対応。
 *
 * 公開側の正式名称は Me / Here / Contact。
 * DB の about.slug は Hugo 時代のファイル名（profile / site / contact）を
 * そのまま使っているため、ここで一箇所だけ変換する。
 */

/** 公開パスに使うスラッグ（/about/{slug}/） */
export type AboutPublicSlug = "me" | "here" | "contact";

/** DB・Markdown ファイル名に使うスラッグ */
export type AboutContentSlug = "profile" | "site" | "contact";

export const ABOUT_PUBLIC_SLUGS: AboutPublicSlug[] = ["me", "here", "contact"];

/** 公開スラッグ → DB / Markdown スラッグ */
export const ABOUT_CONTENT_SLUG_BY_PUBLIC: Record<
  AboutPublicSlug,
  AboutContentSlug
> = {
  me: "profile",
  here: "site",
  contact: "contact",
};

/** DB の Here 記事スラッグ（公開名 Here ≠ DB 名 site） */
export const ABOUT_HERE_CONTENT_SLUG: AboutContentSlug = "site";

export const ABOUT_HERE_PUBLIC_PATH = "/about/here/";
export const ABOUT_ME_PUBLIC_PATH = "/about/me/";
export const ABOUT_CONTACT_CONTENT_SLUG: AboutContentSlug = "contact";
export const ABOUT_CONTACT_PUBLIC_PATH = "/about/contact/";

/** 旧 URL（/about/site/ など）から現在の公開パスへ */
export function redirectPathForLegacyAboutSlug(
  slug: string,
): string | null {
  if (slug === "profile") return ABOUT_ME_PUBLIC_PATH;
  if (slug === "site") return ABOUT_HERE_PUBLIC_PATH;
  return null;
}

/** 公開スラッグとして妥当か */
export function isAboutPublicSlug(value: string): value is AboutPublicSlug {
  return ABOUT_PUBLIC_SLUGS.includes(value as AboutPublicSlug);
}

/** 公開スラッグから DB スラッグを得る（不明なら null） */
export function aboutContentSlugFromPublic(
  publicSlug: string,
): AboutContentSlug | null {
  if (!isAboutPublicSlug(publicSlug)) return null;
  return ABOUT_CONTENT_SLUG_BY_PUBLIC[publicSlug];
}

/** DB スラッグから公開スラッグを得る（静的パス生成用） */
export function aboutPublicSlugFromContent(
  contentSlug: string,
): AboutPublicSlug | null {
  if (contentSlug === "profile") return "me";
  if (contentSlug === "site") return "here";
  if (contentSlug === "contact") return "contact";
  return null;
}
