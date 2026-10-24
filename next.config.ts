import type { NextConfig } from "next";

// Product images uploaded through Admin live in Supabase Storage; allow that host for next/image.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  poweredByHeader: false,
  // Retired category URLs that have a natural successor keep working (the other retired slugs are hidden, not redirected).
  async redirects() {
    return [
      { source: "/:locale/category/mobiles", destination: "/:locale/category/mobile-tablets", permanent: true },
      { source: "/:locale/category/consoles", destination: "/:locale/category/games", permanent: true },
      { source: "/:locale/category/game-titles", destination: "/:locale/category/games", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
