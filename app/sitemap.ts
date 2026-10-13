import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 1,
      url: siteUrl,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 0.8,
      url: `${siteUrl}/login`,
    },
    {
      changeFrequency: "yearly",
      lastModified: new Date(),
      priority: 0.3,
      url: `${siteUrl}/terms`,
    },
    {
      changeFrequency: "yearly",
      lastModified: new Date(),
      priority: 0.3,
      url: `${siteUrl}/privacy`,
    },
  ];
}
