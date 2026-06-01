import type { MetadataRoute } from "next";

// Base URL for absolute sitemap entries. VERCEL_PROJECT_PRODUCTION_URL is set
// automatically on Vercel; override with NEXT_PUBLIC_SITE_URL if using a custom
// domain. Falls back to localhost for local dev.
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Only the static, genuinely indexable pages are listed. The dynamic
// /player/[tag] and /clan/[tag] pages are intentionally excluded (thin content +
// infinite URL space) and remain blocked in robots.txt.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/data`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/player`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/clan`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
