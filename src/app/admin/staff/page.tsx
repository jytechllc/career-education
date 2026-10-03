import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { listEnvStaff, requireStaff } from "@/lib/admin-auth";
import { staffMembers } from "@/lib/schema";
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/staff-roles";

import { AddStaffForm, StaffRowControls } from "./StaffControls";

const ROLE_HELP: Record<StaffRole, string> = {
  admin: "全部后台页面，并可管理员工",
  supervisor: "全部后台页面（学生申请、站内学员、合作机构），不能管理员工",
};

export default async function AdminStaffPage() {
  const me = await requireStaff("/admin/staff", { adminOnly: true });

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
        <h1 className="text-2xl font-bold text-yellow-900">员工</h1>
        <p className="text-sm text-gray-500 mt-1">
          员工用自己的邮箱登录（需已验证，Google 登录即可）。添加后下一次打开页面就生效。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-yellow-900">添加员工</h2>
        <AddStaffForm />
        <ul className="text-xs text-gray-500 grid gap-1">
          {STAFF_ROLES.map((r) => (
            <li key={r}>
              <span className="font-medium text-gray-700">{ROLE_LABELS[r]}</span>：{ROLE_HELP[r]}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
            <tr>
              <th className="px-4 py-2">邮箱</th>
              <th className="px-4 py-2">角色</th>
              <th className="px-4 py-2">添加人</th>
              <th className="px-4 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  {r.email}
                  {r.email === myEmail ? <span className="ml-2 text-xs text-gray-400">（你）</span> : null}
                </td>
                <td className="px-4 py-2">{ROLE_LABELS[r.role]}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{r.pinned ? "环境变量" : (r.addedBy ?? "—")}</td>
                <td className="px-4 py-2 text-right">
                  {r.pinned ? (
                    <span className="text-xs text-gray-400">固定，需改环境变量</span>
                  ) : r.email === myEmail ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <StaffRowControls email={r.email} role={r.role} />
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
