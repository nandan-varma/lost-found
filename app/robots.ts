import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        allow: ["/", "/login", "/terms", "/privacy"],
        disallow: [
          "/app",
          "/app/",
          "/settings",
          "/settings/",
          "/accept-invitation/",
        ],
        userAgent: "*",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
