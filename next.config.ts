import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 開発インジケータ（左下の N / Route パネル）を非表示
  devIndicators: false,
  trailingSlash: true,
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
    ];
  },
};

export default nextConfig;
