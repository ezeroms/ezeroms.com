import type { Metadata } from "next";
import {
  ogImageMetadata,
  resolveOgImageUrl,
} from "@/lib/content/og-image";

/** カテゴリ一覧ページの title / description / OGP。 */
export function sectionListingMetadata(opts: {
  title: string;
  description?: string;
  ogImage?: string | null;
}): Metadata {
  const images = ogImageMetadata(resolveOgImageUrl(opts.ogImage));
  return {
    title: opts.title,
    description: opts.description,
    ...images,
    openGraph: {
      ...images.openGraph,
      title: opts.title,
      description: opts.description,
    },
    twitter: {
      ...images.twitter,
      title: opts.title,
      description: opts.description,
    },
  };
}

type SectionListingMeta = {
  label: string;
  description: string;
  og_image?: string | null;
};

/** 公開セクションを読み、失敗時はコード上の既定のタイトル／説明文を使う。 */
export async function listingMetadataForSection(
  load: () => Promise<SectionListingMeta>,
  fallback: { label: string; description: string },
): Promise<Metadata> {
  const section = await load().catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? fallback.label,
    description: section?.description || fallback.description,
    ogImage: section?.og_image,
  });
}
