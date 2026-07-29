import type { Metadata } from "next";
import Script from "next/script";
import { ogImageMetadata, resolveOgImageUrl } from "@/lib/content/og-image";
import { loadSiteSettings } from "@/lib/content/queries/site-settings";
import "@/styles/design-tokens.css";
import "@/styles/app.css";
import "@/styles/globals.css";
import "@/styles/legacy/main.css";
import "@/styles/overrides.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings();
  const images = ogImageMetadata(resolveOgImageUrl(settings.og_image));

  return {
    title: {
      default: "ezeroms.com",
      template: "%s | ezeroms.com",
    },
    description: "One thing I can tell you is you got to be free!",
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    ...images,
    openGraph: {
      siteName: "ezeroms.com",
      ...images.openGraph,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/images/common/favicon/favicon.ico" />
      </head>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
