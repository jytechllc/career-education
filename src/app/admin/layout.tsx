import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";

import { ActiveNavIntoView } from "./ActiveNavIntoView";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminDict();

  return { title: t.brand, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

type NavKey =
  | "overview" | "allLearners" | "applications" | "students" | "profiles" | "talents"
  | "jobs" | "internships" | "contacts" | "partners" | "contracts" | "staff" | "activity";
type GroupKey = "learners" | "resources" | "admin";
type NavItem = { href: string; key: NavKey };
type NavGroup = { group: GroupKey; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

/** Top-level entries; groups open to show their pages. */
const NAV: NavEntry[] = [
  { href: "/admin", key: "overview" },
  {
    group: "learners",
    items: [
      { href: "/admin/learners", key: "allLearners" },
      { href: "/admin/applications", key: "applications" },
      { href: "/admin/students", key: "students" },
      { href: "/admin/profiles", key: "profiles" },
      { href: "/admin/talents", key: "talents" },
    ],
  },
  {
    group: "resources",
    items: [
      { href: "/admin/jobs", key: "jobs" },
      { href: "/admin/contacts", key: "contacts" },
      { href: "/admin/partners", key: "partners" },
    ],
  },
  { href: "/admin/contracts", key: "contracts" },
];

const ADMIN_GROUP: NavGroup = {
  group: "admin",
  items: [
    { href: "/admin/staff", key: "staff" },
    { href: "/admin/activity", key: "activity" },
  ],
};

const isGroup = (e: NavEntry): e is NavGroup => "group" in e;

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
  // "/admin" only matches itself; sections also match their subpages.
  // The Hong Kong bank tracker (/admin/internships) lives under 岗位.
  const on = (href: string) =>
    href === "/admin"
      ? path === "/admin"
      : path === href || path.startsWith(`${href}/`) || (href === "/admin/jobs" && path.startsWith("/admin/internships"));
  const entries = role === "admin" ? [...NAV, ADMIN_GROUP] : NAV;
  const activeGroup = entries.find((e): e is NavGroup => isGroup(e) && e.items.some((it) => on(it.href)));
  const langHref = `/admin/lang?to=${lang === "en" ? "zh" : "en"}&back=${encodeURIComponent(path)}`;

  // Sidebar on large screens, so the menu can grow and English labels never
  // wrap; on small screens a top bar whose menu scrolls sideways.
  return (
    <div className="min-h-screen bg-yellow-50 lg:flex">
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-yellow-700 to-yellow-900 text-white">
        <Link className="px-5 py-5 font-bold" href="/admin">
          {t.brand}
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-0.5 text-sm">
          {entries.map((e) =>
            isGroup(e) ? (
              <details key={e.group} className="group/nav" open={activeGroup === e}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 hover:bg-white/15 [&::-webkit-details-marker]:hidden">
                  <span className={activeGroup === e ? "font-medium" : ""}>{t.navGroups[e.group]}</span>
                  <span aria-hidden className="text-xs transition-transform group-open/nav:rotate-90">
                    ▸
                  </span>
                </summary>
                <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-white/20 pl-2">
                  {e.items.map((it) => (
                    <Link
                      key={it.href}
                      aria-current={on(it.href) ? "page" : undefined}
                      className={`rounded-md px-3 py-1.5 ${on(it.href) ? "bg-white text-yellow-800 font-medium" : "text-yellow-50 hover:bg-white/15"}`}
                      href={it.href}
                    >
                      {t.nav[it.key]}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link
                key={e.href}
                aria-current={on(e.href) ? "page" : undefined}
                className={`rounded-md px-3 py-2 ${on(e.href) ? "bg-white text-yellow-800 font-medium" : "hover:bg-white/15"}`}
                href={e.href}
              >
                {t.nav[e.key]}
              </Link>
            ),
          )}
        </nav>
        <div className="border-t border-white/20 px-5 py-4 flex flex-col gap-2 text-xs text-yellow-100">
          <div className="min-w-0">
            <div className="truncate" title={email ?? undefined}>
              {email}
            </div>
            <div className="text-yellow-200/80">{t.roles[role]}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a className="rounded-full border border-white/40 px-2 py-0.5 hover:bg-white/15" href={langHref}>
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
      </aside>

      <header className="lg:hidden bg-gradient-to-r from-yellow-600 to-yellow-800 text-white">
        <div className="px-4 pt-3 flex items-center justify-between gap-3">
          <Link className="font-bold" href="/admin">
            {t.brand}
          </Link>
          <div className="flex items-center gap-3 text-xs text-yellow-100">
            <a className="rounded-full border border-white/40 px-2 py-0.5 hover:bg-white/15" href={langHref}>
              {t.switchTo}
            </a>
            <a className="underline hover:text-white" href="/auth/logout">
              {t.logout}
            </a>
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto whitespace-nowrap px-3 py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          id="admin-nav-mobile"
        >
          {entries.map((e) => {
            const href = isGroup(e) ? e.items[0].href : e.href;
            const active = isGroup(e) ? activeGroup === e : on(e.href);

            return (
              <Link
                key={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1 ${active ? "bg-white text-yellow-800 font-medium" : "hover:bg-white/15"}`}
                href={href}
              >
                {isGroup(e) ? t.navGroups[e.group] : t.nav[e.key]}
              </Link>
            );
          })}
        </nav>
        {activeGroup && (
          <nav className="flex gap-1 overflow-x-auto whitespace-nowrap bg-black/10 px-3 py-1.5 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeGroup.items.map((it) => (
              <Link
                key={it.href}
                aria-current={on(it.href) ? "page" : undefined}
                className={`rounded-full px-2.5 py-0.5 ${on(it.href) ? "bg-white/90 text-yellow-800 font-medium" : "hover:bg-white/15"}`}
                href={it.href}
              >
                {t.nav[it.key]}
              </Link>
            ))}
          </nav>
        )}
        <ActiveNavIntoView navId="admin-nav-mobile" />
      </header>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
