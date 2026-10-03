import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { listEnvStaff, requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { staffMembers } from "@/lib/schema";
import { STAFF_ROLES, type StaffRole } from "@/lib/staff-roles";

import { AddStaffForm, StaffRowControls } from "./StaffControls";

export default async function AdminStaffPage() {
  const me = await requireStaff("/admin/staff", { adminOnly: true });
  const { t: d } = await getAdminDict();
  const t = d.staff;

  const env = listEnvStaff();
  const envEmails = new Set(env.map((e) => e.email));
  const fromDb = await db.select().from(staffMembers).orderBy(asc(staffMembers.createdAt));
  const rows = [
    ...env.map((e) => ({ email: e.email, role: e.role, pinned: true, addedBy: null as string | null })),
    ...fromDb
      .filter((m) => !envEmails.has(m.email) && (m.role === "admin" || m.role === "supervisor"))
      .map((m) => ({ email: m.email, role: m.role as StaffRole, pinned: false, addedBy: m.addedBy })),
  ].sort((a, b) => STAFF_ROLES.indexOf(a.role) - STAFF_ROLES.indexOf(b.role));
  const myEmail = me.email.toLowerCase();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-yellow-900">{t.addTitle}</h2>
        <AddStaffForm roles={d.roles} t={d.staffControls} />
        <ul className="text-xs text-gray-500 grid gap-1">
          {STAFF_ROLES.map((r) => (
            <li key={r}>
              <span className="font-medium text-gray-700">{d.roles[r]}</span> — {t.help[r]}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
            <tr>
              <th className="px-4 py-2">{t.col.email}</th>
              <th className="px-4 py-2">{t.col.role}</th>
              <th className="px-4 py-2">{t.col.addedBy}</th>
              <th className="px-4 py-2 text-right">{t.col.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  {r.email}
                  {r.email === myEmail ? <span className="ml-2 text-xs text-gray-400">{t.you}</span> : null}
                </td>
                <td className="px-4 py-2">{d.roles[r.role]}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{r.pinned ? t.env : (r.addedBy ?? "—")}</td>
                <td className="px-4 py-2 text-right">
                  {r.pinned ? (
                    <span className="text-xs text-gray-400">{t.pinned}</span>
                  ) : r.email === myEmail ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <StaffRowControls email={r.email} role={r.role} roles={d.roles} t={d.staffControls} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
