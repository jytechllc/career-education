import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Stats } from "@/components/Stats";
import { SuccessStories } from "@/components/SuccessStories";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { CTA } from "@/components/CTA";
import { Contact } from "@/components/Contact";
import { Chatbot } from "@/components/Chatbot";

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
      <Stats dict={dict} />
      <SuccessStories dict={dict} />
      <WhyChooseUs dict={dict} />
      <CTA dict={dict} locale={locale} />
      <Contact dict={dict} />
      <Chatbot dict={dict} />
    </>
  );
}
