"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GraduationCap,
  Menu,
  X,
  Globe,
  LogIn,
  LogOut,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

type User = { name?: string; picture?: string; email?: string } | null;

interface NavbarProps {
  locale: string;
  dict: Dictionary;
  user: User;
}

type NavLink = { label: string; href: string };
// `href` is the group's own overview page/anchor — the label is a real link,
// not just a dropdown trigger. `items` holds only the OTHER pages in the
// group (the overview isn't repeated inside its own dropdown).
type NavGroup = { label: string; href: string; items: NavLink[] };

export const Navbar = ({ locale, dict, user }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  const otherLocale = locale === "zh" ? "en" : "zh";

  // Grouped so the desktop bar doesn't run 9 items wide. Grouping is by
  // visitor intent, not by page type: "explore a program" vs "check we're
  // credible" vs "read something" — matches how a prospective student
  // actually moves through the site, not how the pages happen to be routed.
  const homeLink: NavLink = { label: dict.nav.home, href: `/${locale}` };
  const contactLink: NavLink = { label: dict.nav.contact, href: `/${locale}#contact` };

  const navGroups: NavGroup[] = [
    {
      label: dict.nav.service,
      href: `/${locale}#service`,
      items: [{ label: dict.nav.phdAdmission, href: `/${locale}/phd-admission` }],
    },
    {
      label: dict.nav.about,
      href: `/${locale}#about`,
      items: [
        { label: dict.nav.successStories, href: `/${locale}#success-stories` },
        { label: dict.nav.cases, href: `/${locale}/cases` },
      ],
    },
    {
      label: dict.nav.blog,
      href: `/${locale}/blog`,
      items: [{ label: dict.nav.etiquette, href: `/${locale}/etiquette` }],
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-yellow-600 to-yellow-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8" />
          <span className="text-xl md:text-2xl font-bold">
            {locale === "zh" ? "杰圆教育" : "JYEdu"}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link
            href={homeLink.href}
            className="hover:text-yellow-200 transition duration-200 text-sm font-medium tracking-wide"
          >
            {homeLink.label}
          </Link>
          {navGroups.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpenGroup(group.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <Link
                href={group.href}
                className="flex items-center gap-1 hover:text-yellow-200 transition duration-200 text-sm font-medium tracking-wide"
                aria-expanded={openGroup === group.label}
              >
                {group.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              {openGroup === group.label && (
                <div className="absolute left-0 top-full pt-2 w-56">
                  <div className="rounded-lg bg-yellow-800 shadow-xl border border-yellow-600/40 py-1.5 overflow-hidden">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="block px-4 py-2 text-sm font-medium hover:bg-yellow-700 hover:text-yellow-200 transition"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link
            href={contactLink.href}
            className="hover:text-yellow-200 transition duration-200 text-sm font-medium tracking-wide"
          >
            {contactLink.label}
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="flex items-center gap-1.5 text-sm font-medium hover:text-yellow-200 transition"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
            {otherLocale.toUpperCase()}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/profile`}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-yellow-200 transition"
              >
                <UserCircle className="h-4 w-4" />
                {dict.nav.dashboard}
              </Link>
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="h-8 w-8 rounded-full border border-white/40"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-sm font-semibold">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/auth/logout"
                className="flex items-center gap-1.5 text-sm font-medium hover:text-yellow-200 transition"
              >
                <LogOut className="h-4 w-4" />
                {dict.nav.logout}
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/auth/login"
              className="flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition"
            >
              <LogIn className="h-4 w-4" />
              {dict.nav.login}
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-yellow-700 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-yellow-500/30 bg-yellow-700/95 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex flex-col space-y-1">
            <Link
              href={homeLink.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-medium"
            >
              {homeLink.label}
            </Link>
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center">
                  <Link
                    href={group.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-medium"
                  >
                    {group.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMobileGroup(openMobileGroup === group.label ? null : group.label)
                    }
                    className="p-2 rounded-lg hover:bg-yellow-600 transition"
                    aria-expanded={openMobileGroup === group.label}
                    aria-label={group.label}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openMobileGroup === group.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                {openMobileGroup === group.label && (
                  <div className="ml-3 border-l border-yellow-500/40 pl-3 flex flex-col space-y-1 py-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-medium"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href={contactLink.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-medium"
            >
              {contactLink.label}
            </Link>
            <Link
              href={`/${otherLocale}`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2 text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              {otherLocale.toUpperCase()}
            </Link>
            {user ? (
              <>
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2 text-sm font-medium"
                >
                  <UserCircle className="h-4 w-4" />
                  {dict.nav.dashboard}
                </Link>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/auth/logout"
                  className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  {dict.nav.logout}
                </a>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a
                href="/auth/login"
                className="py-2 px-3 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2 text-sm font-medium"
              >
                <LogIn className="h-4 w-4" />
                {dict.nav.login}
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
