import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { auth0 } from "@/lib/auth0";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        zh: `${baseUrl}/zh`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `${baseUrl}/${locale}`,
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await auth0.getSession();
  const user = session?.user
    ? {
        name: session.user.name as string | undefined,
        picture: session.user.picture as string | undefined,
        email: session.user.email as string | undefined,
      }
    : null;

  return (
    <>
      <Navbar locale={locale} dict={dict} user={user} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} dict={dict} />
    </>
  );
}
