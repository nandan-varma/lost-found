import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: [
          "/app",
          "/app/",
          "/settings",
          "/settings/",
          "/accept-invitation/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
