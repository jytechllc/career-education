import { desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, type Post } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export async function listPosts(locale: Locale, limit = 50): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

export async function getPost(
  locale: Locale,
  slug: string,
): Promise<Post | null> {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}
