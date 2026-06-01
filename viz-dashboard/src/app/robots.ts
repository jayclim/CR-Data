import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Keep bots out of the API and the infinite per-tag URL space (every crawled tag
// would trigger compute), while pointing them at the sitemap of indexable pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/api/", "/player/", "/clan/"],
        crawlDelay: 10,
      },
      // Aggressive AI/scraper bots that can drive large request spikes.
      {
        userAgent: [
          "GPTBot",
          "CCBot",
          "ClaudeBot",
          "Bytespider",
          "AhrefsBot",
          "SemrushBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
