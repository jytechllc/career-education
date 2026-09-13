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
