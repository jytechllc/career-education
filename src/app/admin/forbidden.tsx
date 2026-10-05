import Link from "next/link";
import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";

type Reason = "not-staff" | "unverified" | "admin-only";

const MESSAGE_KEY = {
  "not-staff": "notStaff",
  unverified: "unverified",
  "admin-only": "adminOnly",
} as const;

export default async function AdminNoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await auth0.getSession();

  if (!session) redirect("/auth/login?returnTo=%2Fadmin");

  const email = session.user.email ?? "";
  const role = session.user.email_verified ? await staffRoleOf(email) : null;
  const param = (await searchParams).reason;
  const reason: Reason = !session.user.email_verified
    ? "unverified"
    : param === "admin-only" && role
      ? "admin-only"
      : "not-staff";

  // Staff landing here without a real reason (e.g. access was just granted).
  if (role && reason === "not-staff") redirect("/admin");

  const { lang, t } = await getAdminDict();
  const n = t.noAccess;

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-yellow-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-yellow-900">{n.title}</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          {n[MESSAGE_KEY[reason]].replace("{email}", email)}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {reason === "admin-only" ? (
            <Link
              className="rounded-full bg-yellow-600 px-5 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              href="/admin"
            >
              {n.backToAdmin}
            </Link>
          ) : (
            <a
              className="rounded-full bg-yellow-600 px-5 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              href="/auth/logout"
            >
              {n.switchAccount}
            </a>
          )}
          <Link
            className="rounded-full border border-yellow-300 px-5 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-50"
            href={lang === "en" ? "/en" : "/zh"}
          >
            {t.backToSite}
          </Link>
        </div>
      </div>
    </div>
  );
}
