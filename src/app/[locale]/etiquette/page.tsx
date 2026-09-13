import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Clock, Handshake } from "lucide-react";
import { hasLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { listLessons } from "@/lib/etiquette";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale as Locale);
  return {
    title: `${dict.etiquette.title} | ${locale === "zh" ? "杰圆职场教育" : "JY Career"}`,
    description: dict.etiquette.subtitle,
  };
}

export default async function EtiquetteIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;

  const dict = await getDictionary(l);
  const lessons = listLessons(l);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800">
          <Handshake className="h-4 w-4" />
          {dict.etiquette.badge}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
          {dict.etiquette.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600">
          {dict.etiquette.subtitle}
        </p>
      </header>

      {lessons.length === 0 ? (
        <p className="py-20 text-center text-gray-500">{dict.etiquette.empty}</p>
      ) : (
        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/${l}/etiquette/${lesson.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-yellow-400 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-600 text-xs font-semibold text-white">
                    {String(lesson.order).padStart(2, "0")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {lesson.minutes} {dict.etiquette.minutes}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-yellow-700">
                  {lesson.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                  {lesson.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-yellow-700">
                  {dict.etiquette.start}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-14 rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-800 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">{dict.etiquette.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-yellow-50">
          {dict.etiquette.ctaText}
        </p>
        <Link
          href={`/${l}#contact`}
          className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-50"
        >
          {dict.etiquette.ctaButton}
        </Link>
      </section>
    </main>
  );
}
