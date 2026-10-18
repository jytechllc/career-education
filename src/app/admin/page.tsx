import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { loadOps } from "@/lib/ops";

export default async function AdminDashboard() {
  await requireStaff("/admin");
  const { t: d } = await getAdminDict();
  const t = d.ops;
  const ops = await loadOps(t);
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(d.dateLocale, { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
  const k = ops.kpis;
  const v = (n: number | null) => (n == null ? "—" : n.toLocaleString());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat href="/admin/learners" label={t.kpi.learners} value={v(k.learners)} />
        <Stat href="/admin/applications" label={t.kpi.applicationsWeek} value={v(k.applicationsWeek)} />
        <Stat href="/admin/contacts?type=headhunter" label={t.kpi.headhunters} sub={k.hkHeadhunters != null ? t.kpi.hkSz(v(k.hkHeadhunters), v(k.szHeadhunters)) : undefined} value={v(k.headhunters)} />
        <Stat href="/admin/contacts?type=hr" label={t.kpi.hr} value={v(k.hr)} />
        <Stat href="/admin/contacts" label={t.kpi.outreach} sub={k.outreachReplied != null ? t.kpi.replied(v(k.outreachReplied)) : undefined} value={v(k.outreachSent)} />
        <Stat href="/admin/internships" label={t.kpi.jobs} value={v(k.jobs)} />
        <Stat label={t.kpi.postsWeek} value={v(k.postsWeek)} />
      </div>

      <section className="rounded-lg bg-white p-5 shadow">
        <h2 className="mb-3 font-semibold text-yellow-900">
          {t.tasksTitle} <span className="text-sm font-normal text-gray-500">({ops.tasks.length})</span>
        </h2>
        {ops.tasks.length === 0 ? (
          <p className="text-sm text-gray-500">{t.noTasks}</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {ops.tasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs ${task.priority === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
                  {t.priority[task.priority]}
                </span>
                {task.href ? (
                  <Link className="text-gray-800 hover:underline" href={task.href}>
                    {task.text}
                  </Link>
                ) : (
                  <span className="text-gray-800">{task.text}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!ops.jmOk && <p className="mt-3 text-xs text-red-700">{t.jmDown}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow">
          <h2 className="mb-1 font-semibold text-yellow-900">{t.oppTitle}</h2>
          <p className="mb-3 text-xs text-gray-500">{t.oppSubtitle}</p>
          {ops.signups.length > 0 && (
            <ul className="mb-3 flex flex-col gap-1 text-sm">
              {ops.signups.slice(0, 5).map((s, i) => (
                <li key={i}>
                  <span className="mr-1 rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">{t.signupTag}</span>
                  {s.company} · {s.contact_name} <span className="text-xs text-gray-400">{fmt(s.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          {ops.opportunities.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noOpp}</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {ops.opportunities.map((n) => (
                <li key={n.link}>
                  <a className="text-gray-800 hover:underline" href={n.link} rel="noreferrer" target="_blank">
                    {n.title}
                  </a>
                  <div className="text-xs text-gray-400">
                    {n.tags.join(" · ")} · {n.source} · {fmt(n.date)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg bg-white p-5 shadow">
          <h2 className="mb-1 font-semibold text-yellow-900">{t.pipeTitle}</h2>
          <p className="mb-3 text-xs text-gray-500">{t.pipeSubtitle}</p>
          <table className="w-full text-sm">
            <tbody>
              {ops.pipelines.map((x) => (
                <tr key={x.key} className="border-t border-gray-100">
                  <td className="py-1.5 pr-2">{t.pipelines[x.key as keyof typeof t.pipelines]}</td>
                  <td className="py-1.5 pr-2 text-xs text-gray-500 tabular-nums whitespace-nowrap">{fmt(x.last)}</td>
                  <td className="py-1.5 text-right">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${x.ok ? "bg-green-50 text-green-700" : x.ok === false ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                      {x.ok ? t.ok : x.ok === false ? t.stale : t.unknown}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-yellow-900">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </>
  );

  return href ? (
    <Link className="rounded-lg bg-white p-4 shadow transition hover:shadow-md" href={href}>
      {body}
    </Link>
  ) : (
    <div className="rounded-lg bg-white p-4 shadow">{body}</div>
  );
}
