import type { MetadataRoute } from "next";
import { POSTS } from "./blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://metalratesync.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/docs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ...POSTS.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/vs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${base}/vs/shopify-precious-metals-apps`,
      lastModified: new Date("2026-11-15"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/vs/gold-feed-alternative`,
      lastModified: new Date("2026-11-15"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${base}/llms.txt`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
