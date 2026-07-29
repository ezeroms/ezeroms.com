import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 開発インジケータ（左下の N / Route パネル）を非表示
  devIndicators: false,
  trailingSlash: true,
  // HEIC 変換（libheif-js）を Webpack にバンドルさせない
  serverExternalPackages: ["heic-convert", "heic-decode", "libheif-js"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ixumrzgqcbksnvsvugaz.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/booking",
        destination: "https://calendar.app.google/dRiTMZYMWCyUv5xv9",
        permanent: true,
      },
      {
        source: "/chooning-ringo-fes-2025",
        destination: "https://ringofes.info/?from=chooning",
        permanent: false,
      },
      {
        source: "/kuikake",
        destination: "/tabekake/",
        permanent: true,
      },
      {
        source: "/kuikake/:slug*",
        destination: "/tabekake/:slug*",
        permanent: true,
      },
      {
        source: "/admin/kuikake",
        destination: "/admin/tabekake/",
        permanent: true,
      },
      {
        source: "/admin/kuikake/:path*",
        destination: "/admin/tabekake/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
