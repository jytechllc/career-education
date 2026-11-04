import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { pageMeta } from "@/lib/seo";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Stats } from "@/components/Stats";
import { SuccessStories } from "@/components/SuccessStories";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { LatestPosts } from "@/components/LatestPosts";
import { CTA } from "@/components/CTA";
import { Contact } from "@/components/Contact";
import { Chatbot } from "@/components/Chatbot";

// Revalidate hourly so the latest blog posts show up on the homepage.
export const revalidate = 3600;

const orgLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "杰圆职场教育",
  alternateName: "JY Education and Career Center",
  url: "https://edu.jytech.us",
  logo: "https://edu.jytech.us/logo.svg",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+86-173-1801-1997",
    contactType: "customer service",
    availableLanguage: ["Chinese", "English"],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    // The layout's title.template only applies to child segments, so the home page names the brand itself
    title: {
      absolute: locale === "zh"
        ? "杰圆职场教育 | 职业规划 · 留学申请 · 求职辅导"
        : "JY Education and Career Center | Career Planning, Study Abroad & Job Coaching",
    },
    description: dict.meta.description,
    ...pageMeta(locale, ""),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLD) }}
      />
      <Link
        href={`/${locale}/join`}
        className="block bg-yellow-50 px-4 py-2.5 text-center text-sm text-yellow-900 hover:bg-yellow-100"
      >
        {locale === "zh"
          ? "招募实习生：协助维护网站日常内容更新 →"
          : "We're hiring interns to help keep this site's content up to date →"}
      </Link>
      <Hero dict={dict} locale={locale} />
      <Services dict={dict} />
      <LatestPosts dict={dict} locale={locale} />
      <Stats dict={dict} />
      <SuccessStories dict={dict} />
      <WhyChooseUs dict={dict} />
      <CTA dict={dict} locale={locale} />
      <Contact dict={dict} />
      <Chatbot dict={dict} />
    </>
  );
}
