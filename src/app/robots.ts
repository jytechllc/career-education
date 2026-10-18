import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_BASE_URL || "https://edu.jytech.us";

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/sign/", "/partner"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
