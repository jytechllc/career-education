import Link from "next/link";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { collegeCoachingApplications, partnerCredentials, partners } from "@/lib/schema";

export default async function AdminPartnersPage() {
  await requireStaff("/admin/partners");
  const { t: d } = await getAdminDict();
  const t = d.partners;

  const rows = await db
    .select({
      id: partners.id,
      slug: partners.slug,
      name: partners.name,
      contactEmail: partners.contactEmail,
      createdAt: partners.createdAt,
      active: sql<number>`count(${collegeCoachingApplications.id}) filter (where ${collegeCoachingApplications.deletedAt} is null)::int`,
      trashed: sql<number>`count(${collegeCoachingApplications.id}) filter (where ${collegeCoachingApplications.deletedAt} is not null)::int`,
      lastAt: sql<Date | null>`max(${collegeCoachingApplications.createdAt})`,
    })
    .from(partners)
    .leftJoin(collegeCoachingApplications, eq(collegeCoachingApplications.partnerId, partners.id))
    .groupBy(partners.id);

  // Login names only — password hashes never leave the database.
  const logins = await db
    .select({ partnerId: partnerCredentials.partnerId, username: partnerCredentials.username })
    .from(partnerCredentials);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title(rows.length)}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
            <tr>
              <th className="px-4 py-2">{t.col.name}</th>
              <th className="px-4 py-2">{t.col.email}</th>
              <th className="px-4 py-2">{t.col.login}</th>
              <th className="px-4 py-2 text-right">{t.col.active}</th>
              <th className="px-4 py-2 text-right">{t.col.trash}</th>
              <th className="px-4 py-2">{t.col.last}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link className="font-medium text-yellow-800 underline" href={`/admin/applications?partner=${p.id}`}>
                    {p.name}
                  </Link>
                  <div className="text-xs text-gray-400">{p.slug}</div>
                </td>
                <td className="px-4 py-2 text-gray-700">{p.contactEmail ?? "—"}</td>
                <td className="px-4 py-2 text-gray-700">
                  {logins.filter((l) => l.partnerId === p.id).map((l) => l.username).join(", ") || "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{p.active}</td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-500">{p.trashed}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {p.lastAt ? new Date(p.lastAt).toLocaleDateString(d.dateLocale) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
