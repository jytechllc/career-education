import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { hasLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { getPost } from "@/lib/blog/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const post = await getPost(locale as Locale, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary ?? undefined,
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;

  const [dict, post] = await Promise.all([
    getDictionary(l),
    getPost(l, slug),
  ]);
  if (!post) notFound();

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString(l === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href={`/${l}/blog`}
        className="text-sm font-medium text-yellow-700 hover:underline"
      >
        {dict.blog.back}
      </Link>

      <article className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {post.category && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
              {post.category}
            </span>
          )}
          <span>{fmt(post.publishedAt)}</span>
          <span>· {dict.blog.by}</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-4 text-lg text-gray-600">{post.summary}</p>
        )}

        <div className="prose prose-yellow mt-8 max-w-none prose-headings:font-semibold prose-a:text-yellow-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-400">
          {dict.blog.disclaimer}
        </p>
      </article>
    </main>
  );
}
