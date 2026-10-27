import type { MetadataRoute } from "next";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { posts } from "@/lib/schema";

export const revalidate = 3600;

/** Public, indexable pages. Unlisted client reports and account pages are left out. */
const PAGES = [
  "",
  "/blog",
  "/cases",
  "/graduate-admission",
  "/phd-admission",
  "/accounting-phd-plan",
  "/accounting-us-plan",
  "/china-us-study-market",
  "/etiquette",
  "/join",
  "/performing-arts-funding",
  "/personality-careers",
  "/press",
  "/singapore-work-visa-guide",
  "/sydney-industry-report",
  "/us-top-100",
];
const LOCALES = ["zh", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_BASE_URL || "https://edu.jytech.us";
  const now = new Date();
  const pages = LOCALES.flatMap((l) =>
    PAGES.map((p) => ({
      url: `${base}/${l}${p}`,
      lastModified: now,
      changeFrequency: p === "/blog" || p === "" ? ("daily" as const) : ("monthly" as const),
      priority: p === "" ? 1 : 0.6,
    })),
  );
  const published = await db
    .select({ slug: posts.slug, locale: posts.locale, publishedAt: posts.publishedAt })
    .from(posts)
    .where(and(eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(5000)
    .catch(() => []);

  return [
    ...pages,
    ...published.map((p) => ({
      url: `${base}/${p.locale}/blog/${p.slug}`,
      lastModified: p.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
