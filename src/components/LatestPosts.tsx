import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { listPosts } from "@/lib/blog/queries";

// Homepage teaser for the blog: three newest posts plus a link to the index.
// A DB failure hides the section instead of breaking the homepage.
export const LatestPosts = async ({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) => {
  const posts = await listPosts(locale, 3).catch(() => []);
  if (posts.length === 0) return null;

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <section className="py-20 md:py-24 bg-yellow-50/40" id="blog">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-900 mb-4">
            {dict.blog.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{dict.blog.subtitle}</p>
        </div>
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-yellow-400 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {post.category && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
                    {post.category}
                  </span>
                )}
                <span>{fmt(post.publishedAt)}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-yellow-700 line-clamp-2">
                {post.title}
              </h3>
              {post.summary && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
                  {post.summary}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-yellow-700">
                {dict.blog.readMore}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 rounded-full border border-yellow-600 px-6 py-2.5 text-sm font-medium text-yellow-800 transition hover:bg-yellow-600 hover:text-white"
          >
            {locale === "zh" ? "查看全部文章" : "View all posts"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
