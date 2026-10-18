import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { listLearners, type LearnerSource } from "@/lib/learners";

const SOURCES: LearnerSource[] = ["application", "site", "profile"];

const BADGE: Record<LearnerSource, string> = {
  application: "bg-blue-50 text-blue-700",
  site: "bg-green-50 text-green-700",
  profile: "bg-yellow-100 text-yellow-900",
};

export default async function AdminLearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const source = SOURCES.find((s) => s === sp.source);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ source, q: q || undefined, ...over })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/learners${s ? `?${s}` : ""}`;
  };

  await requireStaff(href({}));
  const { t: d } = await getAdminDict();
  const t = d.learners;

  const all = await listLearners();
  const needle = q.toLowerCase();
  const matchesQ = (l: (typeof all)[number]) =>
    !needle || [l.name, l.email, l.school, l.goal, l.profileCode, l.partner, l.owner, l.poc].some((v) => v?.toLowerCase().includes(needle));
  const searched = all.filter(matchesQ);
  const inSource = (l: (typeof all)[number], s: LearnerSource) => l.sources.includes(s);
  const rows = source ? searched.filter((l) => inSource(l, source)) : searched;
  const count = (s?: LearnerSource) => (s ? searched.filter((l) => inSource(l, s)).length : searched.length);
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${active ? "bg-yellow-700 text-white" : "bg-white text-yellow-900 hover:bg-yellow-100"}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-yellow-900">{t.title(all.length)}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
        </div>
        <Link className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white" href="/admin/profiles">
          {t.upload}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className={chip(!source)} href={href({ source: undefined })}>
          {t.all} <span className="opacity-70">{count()}</span>
        </Link>
        {SOURCES.map((s) => (
          <Link key={s} className={chip(source === s)} href={href({ source: s })}>
            {t.sources[s]} <span className="opacity-70">{count(s)}</span>
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        {source && <input name="source" type="hidden" value={source} />}
        <input
          className="h-10 w-72 max-w-full rounded-md border border-yellow-200 bg-white px-3 text-sm"
          defaultValue={q}
          name="q"
          placeholder={t.searchPlaceholder}
          type="search"
        />
        <button className="h-10 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700" type="submit">
          {t.search}
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">{t.empty}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
              <tr>
                <th className="px-4 py-2">{t.col.name}</th>
                <th className="px-4 py-2">{t.col.source}</th>
                <th className="px-4 py-2">{t.col.school}</th>
                <th className="px-4 py-2">{t.col.goal}</th>
                <th className="px-4 py-2">{t.col.owner}</th>
                <th className="px-4 py-2">{t.col.contact}</th>
                <th className="px-4 py-2">{t.col.updated}</th>
                <th className="px-4 py-2">{t.col.open}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.key} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2">
                    <div className="font-medium">{l.name}</div>
                    {l.profileCode && <div className="text-xs text-gray-400">{l.profileCode}</div>}
                    {l.caseStatus && (
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs ${l.caseStatus === "new" ? "bg-red-50 text-red-700" : l.caseStatus === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.caseStatus[l.caseStatus as "new" | "active" | "closed"] ?? l.caseStatus}
                      </span>
                    )}
                    {l.partner && <div className="text-xs text-gray-500">{t.via(l.partner)}</div>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {l.sources.map((s) => (
                        <span key={s} className={`rounded-full px-2 py-0.5 text-xs ${BADGE[s]}`}>
                          {t.sources[s]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-64 px-4 py-2 text-xs text-gray-700">{l.school ?? "—"}</td>
                  <td className="max-w-56 px-4 py-2 text-xs text-gray-700">{l.goal ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    <div>{l.owner ?? "—"}</div>
                    {l.poc && <div className="text-gray-500">POC：{l.poc}</div>}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    <div>{l.email ?? "—"}</div>
                    {l.phone && <div>{l.phone}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">{l.updatedAt.toLocaleDateString(d.dateLocale)}</td>
                  <td className="px-4 py-2 text-xs">
                    <div className="flex flex-col gap-1">
                      {l.profileId && (
                        <Link className="text-yellow-800 underline" href={`/admin/profiles/${l.profileId}`}>
                          {t.open.profile}
                        </Link>
                      )}
                      {l.applicationIds.map((id) => (
                        <span key={id} className="flex gap-2">
                          <Link className="text-yellow-800 underline" href={`/admin/applications?q=${encodeURIComponent(l.email ?? l.name)}`}>
                            {t.open.application}
                          </Link>
                          <Link className="text-gray-500 underline" href={`/admin/applications/${id}/edit`}>
                            {t.open.edit}
                          </Link>
                        </span>
                      ))}
                      {l.candidateId && (
                        <Link className="text-yellow-800 underline" href={`/admin/students?q=${encodeURIComponent(l.email ?? l.name)}`}>
                          {t.open.site}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">{t.note}</p>
    </div>
  );
}
