import Link from "next/link";
import { headers } from "next/headers";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";

/**
 * Rendered with a 403 when an admin page calls forbidden() (via requireStaff).
 * Takes no props, so it re-derives why from the session. Non-staff never see
 * the admin header, so this page carries its own language switch.
 */
export default async function AdminForbidden() {
  const session = await auth0.getSession();
  const email = session?.user.email ?? "";
  const verified = Boolean(session?.user.email_verified);
  const role = verified ? await staffRoleOf(email) : null;
  const key = !verified ? "unverified" : role ? "adminOnly" : "notStaff";

  const { lang, t } = await getAdminDict();
  const n = t.noAccess;
  const path = (await headers()).get("x-pathname") ?? "/admin";

  return (
    <div className={`${role ? "py-16" : "min-h-screen bg-yellow-50"} flex items-center justify-center px-4`}>
      <div className="w-full max-w-md rounded-2xl border border-yellow-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-yellow-900">{n.title}</h1>
          <a
            className="shrink-0 rounded-full border border-yellow-300 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-50"
            href={`/admin/lang?to=${lang === "en" ? "zh" : "en"}&back=${encodeURIComponent(path)}`}
          >
            {t.switchTo}
          </a>
        </div>
        <p className="mt-1 text-xs font-medium tracking-wider text-gray-400">403</p>
        <p className="mt-4 text-gray-700 leading-relaxed">{n[key].replace("{email}", email)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {role ? (
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
