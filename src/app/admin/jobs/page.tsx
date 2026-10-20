import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { type BoardTab, JOB_REGIONS, type JobBoard, type JobFilters, type JobRegion, fetchJobBoard } from "@/lib/jobs";

import JobsTable from "./JobsTable";

const TABS: BoardTab[] = ["all", "intern", "entry", "experienced"];
const PAGE_SIZE = 30; // job-matching's board page size

type SP = { type?: string; q?: string; loc?: string; category?: string; sponsor?: string; region?: string; page?: string };

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f: JobFilters = {
    type: TABS.includes(sp.type as BoardTab) ? (sp.type as BoardTab) : "all",
    q: (sp.q ?? "").trim().slice(0, 100),
    loc: (sp.loc ?? "").trim().slice(0, 100),
    category: (sp.category ?? "").trim().slice(0, 50),
    sponsor: sp.sponsor === "1",
    region: JOB_REGIONS.includes(sp.region as JobRegion) ? (sp.region as JobRegion) : "",
    page: Math.max(0, Math.min(500, Number(sp.page) || 0)),
  };
  const href = (patch: Partial<Record<keyof SP, string | undefined>>) => {
    const next: Record<string, string | undefined> = {
      type: f.type === "all" ? undefined : f.type,
      q: f.q || undefined,
      loc: f.loc || undefined,
      category: f.category || undefined,
      sponsor: f.sponsor ? "1" : undefined,
      region: f.region || undefined,
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
        {f.region && <input name="region" type="hidden" value={f.region} />}
        <input className="w-64 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm" defaultValue={f.q} name="q" placeholder={t.searchPlaceholder} />
        <input className="w-48 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm" defaultValue={f.loc} name="loc" placeholder={t.locPlaceholder} />
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input defaultChecked={f.sponsor} name="sponsor" type="checkbox" value="1" />
          {t.sponsor}
        </label>
        <button className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white hover:bg-yellow-800" type="submit">{t.search}</button>
        {(f.q || f.loc || f.category || f.sponsor || f.region || f.type !== "all") && (
          <Link className="self-center text-sm text-gray-500 underline" href="/admin/jobs">{t.clear}</Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <Link className={chip(!f.region)} href={href({ region: undefined })}>{t.allRegions}</Link>
        {JOB_REGIONS.map((r) => (
          <Link key={r} className={chip(f.region === r)} href={href({ region: f.region === r ? undefined : r })}>
            {t.regions[r]}
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
          <JobsTable items={data.items} lang={lang} t={t} />
          <div className="flex items-center justify-between text-sm">
            {f.page > 0 ? <Link className="text-yellow-800 underline" href={href({ page: f.page > 1 ? String(f.page - 1) : undefined })}>{t.prev}</Link> : <span />}
            {data.hasMore && <Link className="text-yellow-800 underline" href={href({ page: String(f.page + 1) })}>{t.next}</Link>}
          </div>
        </>
      )}
    </div>
  );
}
