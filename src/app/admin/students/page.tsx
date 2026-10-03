import { desc, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { candidates } from "@/lib/schema";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);

  await requireStaff(`/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);

  const { t: d } = await getAdminDict();
  const t = d.students;
  const like = `%${q}%`;
  const rows = await db
    .select()
    .from(candidates)
    .where(q ? or(ilike(candidates.name, like), ilike(candidates.email, like)) : undefined)
    .orderBy(desc(candidates.updatedAt))
    .limit(500);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title(rows.length)}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <form className="flex gap-2" method="get">
        <input
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm w-64 max-w-full"
          defaultValue={q}
          name="q"
          placeholder={t.searchPlaceholder}
          type="search"
        />
        <button
          className="h-10 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
          type="submit"
        >
          {t.search}
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {q ? t.emptySearch : t.empty}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
              <tr>
                <th className="px-4 py-2">{t.col.name}</th>
                <th className="px-4 py-2">{t.col.contact}</th>
                <th className="px-4 py-2">{t.col.location}</th>
                <th className="px-4 py-2">{t.col.job}</th>
                <th className="px-4 py-2">{t.col.visa}</th>
                <th className="px-4 py-2">{t.col.linkedin}</th>
                <th className="px-4 py-2">{t.col.updated}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 font-medium">{c.name ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {c.email ?? "—"}
                    {c.phone ? <div className="text-xs text-gray-500">{c.phone}</div> : null}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {[c.jobType, c.yearsOfExperience != null ? t.years(c.yearsOfExperience) : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {c.needsVisaSponsorship == null ? "—" : c.needsVisaSponsorship ? t.yes : t.no}
                  </td>
                  <td className="px-4 py-2">
                    {c.linkedinUrl ? (
                      <a className="text-yellow-700 underline" href={c.linkedinUrl} rel="noreferrer" target="_blank">
                        {t.open}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {c.updatedAt.toLocaleDateString(d.dateLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
