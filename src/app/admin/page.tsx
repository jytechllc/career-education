import Link from "next/link";
import { count, desc, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { candidates, collegeCoachingApplications, partners } from "@/lib/schema";

export default async function AdminOverviewPage() {
  await requireAdmin("/admin");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [[active], [trashed], [lastWeek], [students], byPartner, recent] =
    await Promise.all([
      db
        .select({ n: count() })
        .from(collegeCoachingApplications)
        .where(isNull(collegeCoachingApplications.deletedAt)),
      db
        .select({ n: count() })
        .from(collegeCoachingApplications)
        .where(isNotNull(collegeCoachingApplications.deletedAt)),
      db
        .select({ n: count() })
        .from(collegeCoachingApplications)
        .where(gt(collegeCoachingApplications.createdAt, weekAgo)),
      db.select({ n: count() }).from(candidates),
      db
        .select({
          id: partners.id,
          name: partners.name,
          n: sql<number>`count(${collegeCoachingApplications.id})::int`,
        })
        .from(partners)
        .leftJoin(
          collegeCoachingApplications,
          eq(collegeCoachingApplications.partnerId, partners.id),
        )
        .groupBy(partners.id, partners.name),
      db
        .select({
          id: collegeCoachingApplications.id,
          fullName: collegeCoachingApplications.fullName,
          email: collegeCoachingApplications.email,
          intendedMajor: collegeCoachingApplications.intendedMajor,
          createdAt: collegeCoachingApplications.createdAt,
          partner: partners.name,
        })
        .from(collegeCoachingApplications)
        .leftJoin(partners, eq(partners.id, collegeCoachingApplications.partnerId))
        .where(isNull(collegeCoachingApplications.deletedAt))
        .orderBy(desc(collegeCoachingApplications.createdAt))
        .limit(5),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-yellow-900">概览</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="学生申请" value={active.n} href="/admin/applications" />
        <Stat label="近 7 天新增" value={lastWeek.n} href="/admin/applications" />
        <Stat label="回收站" value={trashed.n} href="/admin/applications?trash=1" />
        <Stat label="站内学员" value={students.n} href="/admin/students" />
      </div>

      <section className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-yellow-900">最新申请</h2>
          <Link className="text-sm text-yellow-700 underline" href="/admin/applications">
            全部申请
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">还没有申请。</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-900">{r.fullName}</span>
                  <span className="ml-2 text-gray-500">{r.email}</span>
                  {r.intendedMajor ? (
                    <span className="ml-2 text-gray-500">· {r.intendedMajor}</span>
                  ) : null}
                </div>
                <span className="text-xs text-gray-400">
                  {r.partner} · {r.createdAt.toLocaleDateString("zh-CN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-yellow-900 mb-3">按合作机构</h2>
        <ul className="divide-y divide-gray-100 text-sm">
          {byPartner.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between">
              <Link className="text-yellow-800 underline" href={`/admin/applications?partner=${p.id}`}>
                {p.name}
              </Link>
              <span className="tabular-nums text-gray-600">{p.n} 份</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link className="bg-white rounded-lg shadow p-4 hover:shadow-md transition" href={href}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-yellow-900 tabular-nums">{value}</p>
    </Link>
  );
}
