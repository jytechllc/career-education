import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { hasLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { getLesson, getNeighbors, listLessons } from "@/lib/etiquette";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    listLessons(locale).map((lesson) => ({ locale, slug: lesson.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const lesson = getLesson(locale as Locale, slug);
  if (!lesson) return {};
  return { title: lesson.title, description: lesson.summary };
}

export default async function EtiquetteLesson({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;

  const dict = await getDictionary(l);
  const lesson = getLesson(l, slug);
  if (!lesson) notFound();

  const { prev, next } = getNeighbors(l, slug);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href={`/${l}/etiquette`}
        className="text-sm font-medium text-yellow-700 hover:underline"
      >
        {dict.etiquette.back}
      </Link>

      <article className="mt-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
            {dict.etiquette.moduleLabel} {String(lesson.order).padStart(2, "0")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {lesson.minutes} {dict.etiquette.minutes}
          </span>
          <span>· {dict.blog.by}</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-4 text-lg text-gray-600">{lesson.summary}</p>

        <div className="prose prose-yellow mt-8 max-w-none prose-headings:font-semibold prose-a:text-yellow-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.content}
          </ReactMarkdown>
        </div>

        {lesson.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {lesson.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      <nav className="mt-12 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/${l}/etiquette/${prev.slug}`}
            className="group rounded-xl border border-gray-200 p-4 transition hover:border-yellow-400"
          >
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <ArrowLeft className="h-3.5 w-3.5" />
              {dict.etiquette.prev}
            </span>
            <p className="mt-1 text-sm font-medium text-gray-900 group-hover:text-yellow-700">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/${l}/etiquette/${next.slug}`}
            className="group rounded-xl border border-gray-200 p-4 text-right transition hover:border-yellow-400 sm:col-start-2"
          >
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              {dict.etiquette.next}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <p className="mt-1 text-sm font-medium text-gray-900 group-hover:text-yellow-700">
              {next.title}
            </p>
          </Link>
        )}
      </nav>

      <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-400">
        {dict.etiquette.disclaimer}
      </p>
    </main>
  );
}
