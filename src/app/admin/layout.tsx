import type { Metadata } from "next";
import Link from "next/link";

import { auth0 } from "@/lib/auth0";
import { isAdminEmail } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "管理后台",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "概览" },
  { href: "/admin/applications", label: "学生申请" },
  { href: "/admin/students", label: "站内学员" },
  { href: "/admin/partners", label: "合作机构" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each page gates itself (it knows its own returnTo). The chrome is only
  // drawn for admins, so a non-admin's 404 doesn't reveal the admin nav.
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const isAdmin = !!session?.user.email_verified && isAdminEmail(email);

  if (!isAdmin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link className="font-bold" href="/admin">
              杰圆教育 · 管理后台
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  className="rounded-full px-3 py-1 hover:bg-white/15"
                  href={n.href}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-yellow-100">
            <span>{email}</span>
            <Link className="underline hover:text-white" href="/zh">
              返回网站
            </Link>
            <a className="underline hover:text-white" href="/auth/logout">
              退出
            </a>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
