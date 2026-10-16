import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import {
  HK_SUMMER_2027_INTERNSHIPS,
  INTERNSHIPS_CHECKED_AT,
  INTERNSHIPS_SHEET_URL,
  type InternshipStatus,
  type InternshipTier,
} from "@/lib/internships";

const TIERS: InternshipTier[] = ["A", "B", "C", "D"];

const STATUS_STYLE: Record<InternshipStatus, string> = {
  open: "bg-green-100 text-green-800",
  likelyOpen: "bg-green-50 text-green-700",
  notYet: "bg-blue-50 text-blue-700",
  closed: "bg-gray-100 text-gray-500",
  unknown: "bg-yellow-100 text-yellow-800",
};

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = sp.status && sp.status in STATUS_STYLE ? (sp.status as InternshipStatus) : null;

  const qs = new URLSearchParams({ ...(q && { q }), ...(status && { status }) }).toString();

  await requireStaff(`/admin/internships${qs ? `?${qs}` : ""}`);
  const { t: d } = await getAdminDict();
  const t = d.internships;

  const needle = q.toLowerCase();
  const shown = HK_SUMMER_2027_INTERNSHIPS.filter(
    (r) =>
      (!status || r.status === status) &&
      (!needle || `${r.firm} ${r.programme} ${r.eligibility}`.toLowerCase().includes(needle)),
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle(INTERNSHIPS_CHECKED_AT)}</p>
        <a
          className="mt-2 inline-flex items-center gap-1 text-sm text-yellow-800 underline"
          href={INTERNSHIPS_SHEET_URL}
          rel="noreferrer"
          target="_blank"
        >
          {t.openSheet} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm w-64"
          defaultValue={q}
          name="q"
          placeholder={t.searchPlaceholder}
        />
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          defaultValue={status ?? ""}
          name="status"
        >
          <option value="">{t.allStatuses}</option>
          {(Object.keys(STATUS_STYLE) as InternshipStatus[]).map((s) => (
            <option key={s} value={s}>
              {t.statuses[s]}
            </option>
          ))}
        </select>
        <button className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white hover:bg-yellow-800" type="submit">
          {t.filter}
        </button>
        {(q || status) && (
          <Link className="self-center text-sm text-gray-500 underline" href="/admin/internships">
            {t.clear}
          </Link>
        )}
      </form>

      {shown.length === 0 && <p className="text-sm text-gray-500">{t.empty}</p>}

      {TIERS.map((tier) => {
        const rows = shown.filter((r) => r.tier === tier);

        if (rows.length === 0) return null;

        return (
          <section key={tier} className="flex flex-col gap-2">
            <h2 className="font-semibold text-yellow-900">
              {t.tiers[tier]} <span className="text-sm font-normal text-gray-500">({rows.length})</span>
            </h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
                  <tr>
                    <th className="px-4 py-2">{t.col.firm}</th>
                    <th className="px-4 py-2">{t.col.programme}</th>
                    <th className="px-4 py-2">{t.col.deadline}</th>
                    <th className="px-4 py-2">{t.col.status}</th>
                    <th className="px-4 py-2">{t.col.eligibility}</th>
                    <th className="px-4 py-2">{t.col.source}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.firm}-${r.programme}`} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="font-medium">{r.firm}</div>
                        <div className="text-xs text-gray-400">{t.kinds[r.kind]}</div>
                      </td>
                      <td className="px-4 py-2 min-w-64">
                        {r.url ? (
                          <a className="text-yellow-800 underline" href={r.url} rel="noreferrer" target="_blank">
                            {r.programme}
                          </a>
                        ) : (
                          r.programme
                        )}
                        <div className="text-xs text-gray-500">{r.duration}</div>
                      </td>
                      <td className="px-4 py-2 min-w-40">{r.deadline}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[r.status]}`}>
                          {t.statuses[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2 min-w-56 text-gray-700">{r.eligibility}</td>
                      <td className="px-4 py-2 min-w-40 text-xs text-gray-500">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="text-xs text-gray-500">{t.note}</p>
    </div>
  );
}
