import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { hasLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { listPosts } from "@/lib/blog/queries";

export const dynamic = "force-dynamic";

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;

  const dict = await getDictionary(l);
  const posts = await listPosts(l);

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString(l === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {dict.blog.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          {dict.blog.subtitle}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-gray-500">{dict.blog.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${l}/blog/${post.slug}`}
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
              <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-yellow-700">
                {post.title}
              </h2>
              {post.summary && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
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
      )}
    </main>
  );
}
