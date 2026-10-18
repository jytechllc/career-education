import { notFound } from "next/navigation";
import Script from "next/script";
import type { Metadata } from "next";
import { hasLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  // No canonical here: a layout's alternates are inherited by every page
  // under it, which told Google that all pages (blog posts included) were
  // copies of the home page. Pages that need one set their own.
  return {
    metadataBase: new URL(baseUrl),
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
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
  const isStaff = session?.user.email_verified
    ? !!(await staffRoleOf(session.user.email))
    : false;

  return (
    <>
      <Navbar locale={locale} dict={dict} user={user} isStaff={isStaff} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} dict={dict} />
      {/* Public pages only (admin has its own layout); staff visits are left out of the numbers. */}
      {GA_ID && !isStaff && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
