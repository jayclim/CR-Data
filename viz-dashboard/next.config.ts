import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Serve images as static files - no CPU/bandwidth for optimization
  },
  async headers() {
    // Long-lived, immutable caching for static assets in /public so browsers
    // serve them from local cache on repeat views instead of re-requesting them.
    // Every re-request counts as a Vercel Edge Request, so caching these
    // content-stable card/asset PNGs for a year drops repeat-visit request volume.
    return [
      {
        source: "/cards/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
