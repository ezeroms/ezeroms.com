import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/content/absolute-url";

/** Site-wide OGP / card thumbnail size (1.91:1). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Tailwind aspect class for 1200×630. */
export const OG_IMAGE_ASPECT_CLASS = "aspect-[1200/630]";

const DEFAULT_OG_PATH = "/images/common/og-image.png";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://ezeroms.com"
  );
}

/**
 * Pick the first non-empty image URL, else site default.
 * Paths are absolutized against the site origin.
 */
export function resolveOgImageUrl(
  ...candidates: Array<string | null | undefined>
): string {
  const base = siteUrl();
  for (const c of candidates) {
    const v = (c ?? "").trim();
    if (v) return absoluteUrl(v, base);
  }
  return absoluteUrl(DEFAULT_OG_PATH, base);
}

/** openGraph.images + twitter card image payload. */
export function ogImageMetadata(imageUrl: string): Pick<
  Metadata,
  "openGraph" | "twitter"
> {
  return {
    openGraph: {
      images: [
        {
          url: imageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}
