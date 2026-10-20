import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { type JobBoard, fetchJobBoard } from "@/lib/jobs";
import {
  HK_BANK_SUMMER_2027,
  type InternshipCollection,
  type InternshipStatus,
  fetchInternshipCollection,
} from "@/lib/internships";

import JobsTable from "../jobs/JobsTable";

const GROUPS = ["open", "notYet", "closed", "unknown"] as const;

/** "Probably open" sits with "open". */
function groupOf(s: InternshipStatus): (typeof GROUPS)[number] {
  return s === "likelyOpen" ? "open" : s;
}

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
  searchParams: Promise<{ q?: string; status?: string; region?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status =
    sp.status && sp.status in STATUS_STYLE
      ? (sp.status as InternshipStatus)
      : null;

  // 香港: the researched bank tracker + live Hong Kong internships. 美国: live US internships.
  const region = sp.region === "us" ? "us" : "hk";
  const category = (sp.category ?? "").trim().slice(0, 50);
  const page = Math.max(0, Math.min(500, Number(sp.page) || 0));

  const qs = new URLSearchParams({
    ...(region === "us" && { region }),
    ...(q && { q }),
    ...(status && { status }),
    ...(category && { category }),
    ...(page && { page: String(page) }),
  }).toString();

  await requireStaff(`/admin/internships${qs ? `?${qs}` : ""}`);
  const { lang, t: d } = await getAdminDict();
  const t = d.internships;

  const tabs = (
    <div className="flex flex-wrap gap-2">
      {(["hk", "us"] as const).map((r) => (
        <Link
          key={r}
          className={`rounded-full border px-3 py-1 text-sm ${region === r ? "border-yellow-700 bg-yellow-700 text-white" : "border-gray-300 bg-white hover:border-yellow-700"}`}
          href={r === "hk" ? "/admin/internships" : "/admin/internships?region=us"}
        >
          {t.regionTabs[r]}
        </Link>
      ))}
    </div>
  );

  if (region === "us") {
    let live: JobBoard | null = null;

    try {
      live = await fetchJobBoard({ type: "intern", q, loc: "", category, sponsor: false, region: "us", page });
    } catch (e) {
      console.error("[admin/internships] US board read failed", e);
    }
    const usHref = (patch: { category?: string; page?: number }) => {
      const p = new URLSearchParams({ region: "us", ...(q && { q }) });
      const c = "category" in patch ? patch.category : category;

      if (c) p.set("category", c);
      if (patch.page) p.set("page", String(patch.page));

      return `/admin/internships?${p}`;
    };
    const chip = (on: boolean) =>
      `rounded-full border px-3 py-1 text-sm ${on ? "border-yellow-700 bg-yellow-700 text-white" : "border-gray-300 bg-white hover:border-yellow-700"}`;

    return (
      <div className="flex flex-col gap-5">
        <div>
          <Link className="text-sm text-gray-500 hover:text-yellow-800" href="/admin/jobs">← {d.jobs.title}</Link>
          <h1 className="text-2xl font-bold text-yellow-900">{t.usTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.usSubtitle}</p>
        </div>
        {tabs}
        <form className="flex flex-wrap gap-2" method="get">
          <input name="region" type="hidden" value="us" />
          {category && <input name="category" type="hidden" value={category} />}
          <input className="w-64 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm" defaultValue={q} name="q" placeholder={d.jobs.searchPlaceholder} />
          <button className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white hover:bg-yellow-800" type="submit">{d.jobs.search}</button>
        </form>
        {live && (
          <div className="flex flex-wrap gap-2">
            <Link className={chip(!category)} href={usHref({ category: undefined })}>{d.jobs.allCategories}</Link>
            {live.categories.filter((c) => c.count > 0 || c.name === category).map((c) => (
              <Link key={c.name} className={chip(category === c.name)} href={usHref({ category: category === c.name ? undefined : c.name })}>
                {c.name} <span className="opacity-70">{c.count}</span>
              </Link>
            ))}
          </div>
        )}
        {!live && <p className="text-sm text-red-700">{d.jobs.error}</p>}
        {live && live.items.length === 0 && <p className="text-sm text-gray-500">{d.jobs.empty}</p>}
        {live && live.items.length > 0 && (
          <>
            <p className="text-sm text-gray-500">{d.jobs.showing(live.total, page + 1, Math.max(1, Math.ceil(live.total / 30)))}</p>
            <JobsTable items={live.items} lang={lang} t={d.jobs} />
            <div className="flex items-center justify-between text-sm">
              {page > 0 ? <Link className="text-yellow-800 underline" href={usHref({ page: page - 1 })}>{d.jobs.prev}</Link> : <span />}
              {live.hasMore && <Link className="text-yellow-800 underline" href={usHref({ page: page + 1 })}>{d.jobs.next}</Link>}
            </div>
          </>
        )}
      </div>
    );
  }

  let data: InternshipCollection | null = null;
  let liveHk: JobBoard | null = null;

  [data, liveHk] = await Promise.all([
    fetchInternshipCollection(HK_BANK_SUMMER_2027).catch((e) => {
      console.error("[admin/internships] job-matching read failed", e);

      return null;
    }),
    // Every other Hong Kong internship on the board (company boards, feeds).
    fetchJobBoard({ type: "intern", q, loc: "", category: "", sponsor: false, region: "hk", page: 0 }).catch(() => null),
  ]);

  // Search matches either language, so a firm's Chinese or English name both work.
  const needle = q.toLowerCase();
  const shown = (data?.rows ?? []).filter(
    (r) =>
      (!status || r.effectiveStatus === status) &&
      (!needle ||
        `${r.firm} ${r.programme} ${r.eligibility} ${r.en?.firm} ${r.en?.programme} ${r.en?.eligibility}`
          .toLowerCase()
          .includes(needle)),
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link className="text-sm text-gray-500 hover:text-yellow-800" href="/admin/jobs">← {d.jobs.title}</Link>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.subtitle(data?.checkedAt ?? "—")}
        </p>
      </div>
      {tabs}

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
        <button
          className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white hover:bg-yellow-800"
          type="submit"
        >
          {t.filter}
        </button>
        {(q || status) && (
          <Link
            className="self-center text-sm text-gray-500 underline"
            href="/admin/internships"
          >
            {t.clear}
          </Link>
        )}
      </form>

      {!data && <p className="text-sm text-red-700">{t.error}</p>}
      {data && shown.length === 0 && (
        <p className="text-sm text-gray-500">{t.empty}</p>
      )}

      {GROUPS.map((group) => {
        const rows = shown.filter((r) => groupOf(r.effectiveStatus) === group);

        if (rows.length === 0) return null;

        return (
          <section key={group} className="flex flex-col gap-2">
            <h2 className="font-semibold text-yellow-900">
              {t.groups[group]}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({rows.length})
              </span>
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
                  {rows.map((r) => {
                    // Rows without an English block fall back to the Chinese research fields.
                    const x = (lang === "en" && r.en) || r;

                    return (
                      <tr
                        key={r.id}
                        className="border-t border-gray-100 align-top"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="font-medium">{x.firm}</div>
                          <div className="text-xs text-gray-400">
                            {t.kinds[r.kind]}
                          </div>
                        </td>
                        <td className="px-4 py-2 min-w-64">
                          <a
                            className="text-yellow-800 underline"
                            href={r.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {x.programme}
                          </a>
                          <div className="text-xs text-gray-500">
                            {x.duration}
                          </div>
                        </td>
                        <td className="px-4 py-2 min-w-40">{x.deadlineText}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[r.effectiveStatus]}`}
                          >
                            {t.statuses[r.effectiveStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-2 min-w-56 text-gray-700">
                          {x.eligibility}
                        </td>
                        <td className="px-4 py-2 min-w-40 text-xs text-gray-500">
                          {x.sourceNote}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="text-xs text-gray-500">{t.note}</p>

      {liveHk && liveHk.items.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-yellow-900">
              {t.liveHk} <span className="text-sm font-normal text-gray-500">({liveHk.total})</span>
            </h2>
            <Link className="text-sm text-yellow-800 underline" href="/admin/jobs?type=intern&region=hk">{t.liveHkMore}</Link>
          </div>
          <JobsTable items={liveHk.items} lang={lang} t={d.jobs} />
        </section>
      )}
    </div>
  );
}
