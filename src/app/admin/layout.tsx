import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminDict();

  return { title: t.brand, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", key: "overview" },
  { href: "/admin/applications", key: "applications" },
  { href: "/admin/students", key: "students" },
  { href: "/admin/partners", key: "partners" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each page gates itself (it knows its own returnTo). The chrome is only
  // drawn for admins, so a non-admin's 404 doesn't reveal the admin nav.
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const role = session?.user.email_verified ? await staffRoleOf(email) : null;

  if (!role) return <>{children}</>;

  const { lang, t } = await getAdminDict();
  const path = (await headers()).get("x-pathname") ?? "/admin";
  const nav = [...NAV, ...(role === "admin" ? [{ href: "/admin/staff", key: "staff" } as const] : [])];

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link className="font-bold" href="/admin">
              {t.brand}
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  className="rounded-full px-3 py-1 hover:bg-white/15"
                  href={n.href}
                >
                  {t.nav[n.key]}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-yellow-100">
            <span>
              {email} · {t.roles[role]}
            </span>
            <a
              className="rounded-full border border-white/40 px-2 py-0.5 hover:bg-white/15"
              href={`/admin/lang?to=${lang === "en" ? "zh" : "en"}&back=${encodeURIComponent(path)}`}
            >
              {t.switchTo}
            </a>
            <Link className="underline hover:text-white" href={lang === "en" ? "/en" : "/zh"}>
              {t.backToSite}
            </Link>
            <a className="underline hover:text-white" href="/auth/logout">
              {t.logout}
            </a>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
