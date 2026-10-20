import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { type BoardTab, type JobBoard, type JobFilters, fetchJobBoard } from "@/lib/jobs";

const TABS: BoardTab[] = ["all", "intern", "entry", "experienced"];
const PAGE_SIZE = 30; // job-matching's board page size

const TYPE_STYLE = {
  intern: "bg-blue-50 text-blue-700",
  entry: "bg-green-50 text-green-700",
  experienced: "bg-purple-50 text-purple-700",
} as const;

type SP = { type?: string; q?: string; loc?: string; category?: string; sponsor?: string; page?: string };

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f: JobFilters = {
    type: TABS.includes(sp.type as BoardTab) ? (sp.type as BoardTab) : "all",
    q: (sp.q ?? "").trim().slice(0, 100),
    loc: (sp.loc ?? "").trim().slice(0, 100),
    category: (sp.category ?? "").trim().slice(0, 50),
    sponsor: sp.sponsor === "1",
    page: Math.max(0, Math.min(500, Number(sp.page) || 0)),
  };
  const href = (patch: Partial<Record<keyof SP, string | undefined>>) => {
    const next: Record<string, string | undefined> = {
      type: f.type === "all" ? undefined : f.type,
      q: f.q || undefined,
      loc: f.loc || undefined,
      category: f.category || undefined,
      sponsor: f.sponsor ? "1" : undefined,
      page: undefined, // any filter change goes back to page 1
      ...patch,
    };
    const qs = new URLSearchParams(Object.entries(next).filter((e): e is [string, string] => Boolean(e[1]))).toString();

    return qs ? `/admin/jobs?${qs}` : "/admin/jobs";
  };

  await requireStaff(href({ page: f.page ? String(f.page) : undefined }));
  const { lang, t: d } = await getAdminDict();
  const t = d.jobs;

  let data: JobBoard | null = null;

  try {
    data = await fetchJobBoard(f);
  } catch (e) {
    console.error("[admin/jobs] job-matching read failed", e);
  }
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const dateFmt = new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${on ? "border-yellow-700 bg-yellow-700 text-white" : "border-gray-300 bg-white hover:border-yellow-700"}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
        </div>
        <Link className="text-sm text-yellow-800 underline" href="/admin/internships">{t.curatedLink}</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link key={tab} className={chip(f.type === tab)} href={href({ type: tab === "all" ? undefined : tab })}>
            {t.tabs[tab]}{data && <span className="ml-1 opacity-70">{data.counts[tab]}</span>}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        {f.type !== "all" && <input name="type" type="hidden" value={f.type} />}
        {f.category && <input name="category" type="hidden" value={f.category} />}
        <input className="w-64 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm" defaultValue={f.q} name="q" placeholder={t.searchPlaceholder} />
        <input className="w-48 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm" defaultValue={f.loc} name="loc" placeholder={t.locPlaceholder} />
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input defaultChecked={f.sponsor} name="sponsor" type="checkbox" value="1" />
          {t.sponsor}
        </label>
        <button className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white hover:bg-yellow-800" type="submit">{t.search}</button>
        {(f.q || f.loc || f.category || f.sponsor || f.type !== "all") && (
          <Link className="self-center text-sm text-gray-500 underline" href="/admin/jobs">{t.clear}</Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {t.quickLocs.map(([label, value]) => (
          <Link key={value} className={chip(f.loc.toLowerCase() === value.toLowerCase())} href={href({ loc: f.loc.toLowerCase() === value.toLowerCase() ? undefined : value })}>
            {label}
          </Link>
        ))}
      </div>

      {data && (
        <div className="flex flex-wrap gap-2">
          <Link className={chip(!f.category)} href={href({ category: undefined })}>{t.allCategories}</Link>
          {data.categories.filter((c) => c.count > 0 || c.name === f.category).map((c) => (
            <Link key={c.name} className={chip(f.category === c.name)} href={href({ category: f.category === c.name ? undefined : c.name })}>
              {c.name} <span className="opacity-70">{c.count}</span>
            </Link>
          ))}
        </div>
      )}

      {!data && <p className="text-sm text-red-700">{t.error}</p>}
      {data && data.items.length === 0 && <p className="text-sm text-gray-500">{t.empty}</p>}

      {data && data.items.length > 0 && (
        <>
          <p className="text-sm text-gray-500">{t.showing(data.total, f.page + 1, pages)}</p>
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
                <tr>
                  <th className="px-4 py-2">{t.col.title}</th>
                  <th className="px-4 py-2">{t.col.company}</th>
                  <th className="px-4 py-2">{t.col.type}</th>
                  <th className="px-4 py-2">{t.col.location}</th>
                  <th className="px-4 py-2">{t.col.category}</th>
                  <th className="px-4 py-2">{t.col.posted}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((j) => (
                  <tr key={j.key} className="align-top hover:bg-yellow-50/40">
                    <td className="px-4 py-2">
                      <a className="font-medium text-yellow-900 hover:underline" href={j.url} rel="noreferrer" target="_blank">{j.title}</a>
                      {j.kind === "recruiter" && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{t.recruiter}</span>}
                    </td>
                    <td className="px-4 py-2">{j.company || "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${TYPE_STYLE[j.type]}`}>{t.types[j.type]}</span>
                    </td>
                    <td className="max-w-[16rem] px-4 py-2 text-gray-600">{j.locations.slice(0, 3).join("; ")}{j.locations.length > 3 && " …"}</td>
                    <td className="px-4 py-2 text-gray-600">{j.category || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-500">{j.postedAt ? dateFmt.format(new Date(j.postedAt)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm">
            {f.page > 0 ? <Link className="text-yellow-800 underline" href={href({ page: f.page > 1 ? String(f.page - 1) : undefined })}>{t.prev}</Link> : <span />}
            {data.hasMore && <Link className="text-yellow-800 underline" href={href({ page: String(f.page + 1) })}>{t.next}</Link>}
          </div>
        </>
      )}
    </div>
  );
}
