import type { MetadataRoute } from "next";

import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/about"],
      disallow: ["/api/", "/auth/", "/dashboard/", "/profile", "/success"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl().origin,
  };
}
