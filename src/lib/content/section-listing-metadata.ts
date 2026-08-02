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
  };
}
